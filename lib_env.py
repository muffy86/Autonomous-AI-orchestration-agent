#!/usr/bin/env python3
"""
Production environment validation - fail fast on startup.
Real validation - no theater.
"""

import os
import sys
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


class EnvVarType(Enum):
    """Environment variable types for validation."""
    STRING = "string"
    INT = "int"
    FLOAT = "float"
    BOOL = "bool"
    URL = "url"
    PATH = "path"


@dataclass
class EnvVarSpec:
    """Specification for an environment variable."""
    name: str
    var_type: EnvVarType = EnvVarType.STRING
    required: bool = True
    default: Optional[Any] = None
    description: str = ""
    validator: Optional[callable] = None  # Custom validation function


class EnvValidationError(Exception):
    """Raised when environment validation fails."""
    pass


class EnvironmentValidator:
    """
    Production-ready environment validator.
    
    Features:
    - Type validation (string, int, float, bool, url, path)
    - Required vs optional variables
    - Default values
    - Custom validators
    - Fail-fast on startup
    - Clear error messages
    """
    
    def __init__(self):
        self.specs: List[EnvVarSpec] = []
        self.validated: Dict[str, Any] = {}
    
    def add(
        self,
        name: str,
        var_type: EnvVarType = EnvVarType.STRING,
        required: bool = True,
        default: Optional[Any] = None,
        description: str = "",
        validator: Optional[callable] = None
    ) -> 'EnvironmentValidator':
        """Add an environment variable specification (chainable)."""
        self.specs.append(EnvVarSpec(
            name=name,
            var_type=var_type,
            required=required,
            default=default,
            description=description,
            validator=validator
        ))
        return self
    
    def _parse_value(self, value: str, var_type: EnvVarType) -> Any:
        """Parse string value to specified type."""
        if var_type == EnvVarType.STRING:
            return value
        
        elif var_type == EnvVarType.INT:
            try:
                return int(value)
            except ValueError:
                raise ValueError(f"Cannot convert '{value}' to integer")
        
        elif var_type == EnvVarType.FLOAT:
            try:
                return float(value)
            except ValueError:
                raise ValueError(f"Cannot convert '{value}' to float")
        
        elif var_type == EnvVarType.BOOL:
            return value.lower() in ('true', '1', 'yes', 'on')
        
        elif var_type == EnvVarType.URL:
            if not (value.startswith('http://') or value.startswith('https://')):
                raise ValueError(f"Invalid URL: {value}")
            return value
        
        elif var_type == EnvVarType.PATH:
            # Just return the path string - don't check if it exists yet
            return value
        
        else:
            return value
    
    def validate(self, fail_fast: bool = True) -> Dict[str, Any]:
        """
        Validate all environment variables.
        
        Args:
            fail_fast: If True, raise exception on first error. 
                      If False, collect all errors and raise at end.
        
        Returns:
            Dict of validated environment variables
        
        Raises:
            EnvValidationError: If validation fails
        """
        errors = []
        validated = {}
        
        for spec in self.specs:
            try:
                # Get raw value
                raw_value = os.getenv(spec.name)
                
                # Check if required
                if raw_value is None:
                    if spec.required:
                        if spec.default is not None:
                            value = spec.default
                        else:
                            errors.append(
                                f"Required environment variable '{spec.name}' is not set. "
                                f"{spec.description}"
                            )
                            if fail_fast:
                                raise EnvValidationError(errors[0])
                            continue
                    else:
                        value = spec.default
                else:
                    # Parse to correct type
                    try:
                        value = self._parse_value(raw_value, spec.var_type)
                    except ValueError as e:
                        errors.append(
                            f"Invalid value for '{spec.name}': {e}. {spec.description}"
                        )
                        if fail_fast:
                            raise EnvValidationError(errors[0])
                        continue
                
                # Run custom validator if provided
                if spec.validator and value is not None:
                    try:
                        if not spec.validator(value):
                            errors.append(
                                f"Validation failed for '{spec.name}': value '{value}' "
                                f"did not pass custom validator. {spec.description}"
                            )
                            if fail_fast:
                                raise EnvValidationError(errors[0])
                            continue
                    except Exception as e:
                        errors.append(
                            f"Validator error for '{spec.name}': {e}. {spec.description}"
                        )
                        if fail_fast:
                            raise EnvValidationError(errors[0])
                        continue
                
                validated[spec.name] = value
                
            except EnvValidationError:
                raise
            except Exception as e:
                errors.append(f"Unexpected error validating '{spec.name}': {e}")
                if fail_fast:
                    raise EnvValidationError(errors[0])
        
        # If we collected errors, raise them all
        if errors:
            raise EnvValidationError(
                f"Environment validation failed with {len(errors)} error(s):\n" +
                "\n".join(f"  - {e}" for e in errors)
            )
        
        self.validated = validated
        return validated
    
    def get(self, name: str, default: Any = None) -> Any:
        """Get validated environment variable value."""
        return self.validated.get(name, default)
    
    def print_config(self) -> None:
        """Print validated configuration (safe - doesn't leak secrets)."""
        print("\n" + "="*60)
        print("Environment Configuration")
        print("="*60)
        
        for spec in self.specs:
            value = self.validated.get(spec.name)
            
            # Redact sensitive values
            if any(secret in spec.name.lower() for secret in ['secret', 'key', 'password', 'token']):
                display_value = "***REDACTED***"
            elif value is None:
                display_value = "(not set)"
            else:
                display_value = str(value)
            
            status = "✓" if spec.name in self.validated else "✗"
            required = "[REQUIRED]" if spec.required else "[OPTIONAL]"
            
            print(f"{status} {spec.name} {required}: {display_value}")
            if spec.description:
                print(f"  → {spec.description}")
        
        print("="*60 + "\n")


# Pre-configured validator for orchestrator
def get_orchestrator_env_validator() -> EnvironmentValidator:
    """Get pre-configured environment validator for orchestrator."""
    return (
        EnvironmentValidator()
        .add(
            "ORCH_SECRET",
            var_type=EnvVarType.STRING,
            required=True,
            default="change-me-in-production",
            description="HMAC secret for webhook signatures. Change in production!"
        )
        .add(
            "ORCH_PORT",
            var_type=EnvVarType.INT,
            required=False,
            default=8000,
            description="Port for orchestrator API"
        )
        .add(
            "ORCH_HOST",
            var_type=EnvVarType.STRING,
            required=False,
            default="0.0.0.0",
            description="Host for orchestrator API"
        )
        .add(
            "ORCH_WORKERS",
            var_type=EnvVarType.INT,
            required=False,
            default=1,
            description="Number of worker threads"
        )
        .add(
            "LOG_LEVEL",
            var_type=EnvVarType.STRING,
            required=False,
            default="INFO",
            description="Logging level (DEBUG, INFO, WARNING, ERROR)",
            validator=lambda x: x.upper() in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        )
    )


if __name__ == "__main__":
    # Smoke test
    validator = get_orchestrator_env_validator()
    
    try:
        config = validator.validate(fail_fast=True)
        validator.print_config()
        print("✓ Environment validation passed")
    except EnvValidationError as e:
        print(f"✗ Environment validation failed:\n{e}")
        sys.exit(1)
