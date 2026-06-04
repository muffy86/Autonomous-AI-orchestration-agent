import os
import sys

def test_smoke():
    assert 1 + 1 == 2

def test_python_version():
    assert sys.version_info >= (3, 10)

def test_env_vars():
    assert os.getenv('PATH') is not None
