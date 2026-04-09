# Deployment Checklist

Use this checklist to ensure safe and successful deployments to production.

## Pre-Deployment Checklist

### Code Quality ✅

- [ ] All tests passing locally
  ```bash
  pnpm test:all
  ```
- [ ] No linting errors
  ```bash
  pnpm lint
  ```
- [ ] Type checking passes
  ```bash
  pnpm exec tsc --noEmit
  ```
- [ ] Build succeeds
  ```bash
  pnpm build
  ```
- [ ] Code reviewed and approved
- [ ] All CI/CD checks passing
- [ ] No merge conflicts

### Security 🔒

- [ ] Security audit completed
  ```bash
  pnpm security:check
  ```
- [ ] No critical vulnerabilities
- [ ] Environment variables secured
- [ ] API keys rotated if needed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] SQL injection prevention verified

### Database 🗄️

- [ ] Database migrations tested locally
  ```bash
  pnpm db:migrate
  ```
- [ ] Migration rollback plan ready
- [ ] Database backup created
- [ ] Migration scripts reviewed
- [ ] Indexes created for performance
- [ ] Connection pool configured
- [ ] Read replicas configured (if applicable)

### Dependencies 📦

- [ ] Dependencies up to date
  ```bash
  pnpm outdated
  ```
- [ ] No known vulnerabilities
  ```bash
  pnpm audit
  ```
- [ ] Lock file committed (`pnpm-lock.yaml`)
- [ ] Unnecessary dependencies removed
- [ ] Bundle size checked
  ```bash
  pnpm analyze:bundle
  ```

### Configuration ⚙️

- [ ] Environment variables set in production
  - `POSTGRES_URL`
  - `AUTH_SECRET`
  - `XAI_API_KEY`
  - `POSTGRES_READ_REPLICA_URL` (optional)
  - `REDIS_URL` (optional)
- [ ] Feature flags configured
- [ ] CDN settings verified
- [ ] CORS settings correct
- [ ] Domain configured
- [ ] SSL certificate valid

### Performance ⚡

- [ ] Performance tests run
  ```bash
  pnpm exec lighthouse http://localhost:3000
  ```
- [ ] Core Web Vitals acceptable
  - FCP < 1.0s
  - LCP < 2.5s
  - CLS < 0.1
- [ ] Bundle size within budget (< 300KB)
- [ ] Images optimized
- [ ] Caching configured
- [ ] Database queries optimized

### Monitoring 📊

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics setup (Vercel Analytics, etc.)
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Log aggregation setup
- [ ] Alerts configured
  - Error rate threshold
  - Response time threshold
  - Database connection issues

### Documentation 📚

- [ ] CHANGELOG updated
- [ ] Release notes prepared
- [ ] API documentation current
- [ ] README updated
- [ ] Migration guide available (if breaking changes)
- [ ] Deployment guide reviewed

## Deployment Steps

### 1. Pre-Deploy Communication 📢

- [ ] Notify team of deployment
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare rollback plan
- [ ] Have team available for monitoring

### 2. Database Migration (if needed) 🗄️

```bash
# On production
pnpm db:migrate
```

- [ ] Migration completed successfully
- [ ] Migration time logged
- [ ] Data integrity verified

### 3. Deploy Application 🚀

**For Vercel:**

```bash
# Automatic deployment on push to main
git push origin main

# Or manual deployment
vercel --prod
```

**For Other Platforms:**

```bash
# Docker
docker build -t ai-chatbot .
docker push your-registry/ai-chatbot
docker run -p 3000:3000 ai-chatbot

# Or use your platform's CLI
```

- [ ] Deployment initiated
- [ ] Build logs reviewed
- [ ] Deployment completed
- [ ] Deployment URL noted

### 4. Post-Deploy Verification ✅

- [ ] Application accessible
  - Visit: https://your-domain.com
- [ ] Health check passes
  - Visit: https://your-domain.com/api/health
- [ ] Database connected
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Static assets loading
- [ ] No JavaScript errors in console

### 5. Smoke Testing 🧪

- [ ] User can register/login
- [ ] User can create chat
- [ ] User can send messages
- [ ] AI responses working
- [ ] File uploads working
- [ ] Rate limiting active
- [ ] Error handling working

### 6. Performance Check ⚡

- [ ] Response times acceptable
  - API < 200ms (p95)
  - Page load < 3s
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] CDN caching working
- [ ] Gzip/Brotli compression active

### 7. Monitor for Issues 👀

**Monitor for 1-2 hours after deployment:**

- [ ] Error rate normal
- [ ] Response times normal
- [ ] Database performance normal
- [ ] Memory usage stable
- [ ] No unusual logs
- [ ] User reports reviewed

## Post-Deployment

### Success ✅

- [ ] Tag release in Git
  ```bash
  git tag -a v3.0.24 -m "Release v3.0.24"
  git push origin v3.0.24
  ```
- [ ] Create GitHub release with notes
- [ ] Notify team of successful deployment
- [ ] Update status page
- [ ] Document any issues encountered
- [ ] Schedule post-mortem (if issues)

### Rollback (if needed) 🔄

If critical issues found:

1. **Immediate Rollback**
   ```bash
   # Vercel
   vercel rollback
   
   # Or revert git commit
   git revert HEAD
   git push origin main
   ```

2. **Database Rollback** (if needed)
   - Run rollback migration
   - Restore database backup

3. **Communication**
   - [ ] Notify team
   - [ ] Update status page
   - [ ] Inform users (if necessary)

4. **Investigation**
   - [ ] Identify root cause
   - [ ] Create incident report
   - [ ] Plan fix
   - [ ] Schedule re-deployment

## Environment-Specific Checklists

### Staging Deployment

- [ ] Use staging database
- [ ] Use test API keys
- [ ] Enable debug logging
- [ ] Test with production-like data
- [ ] Verify migrations work
- [ ] Run full test suite

### Production Deployment

- [ ] Use production database
- [ ] Use production API keys
- [ ] Disable debug logging
- [ ] Enable error tracking
- [ ] Enable performance monitoring
- [ ] Have rollback plan ready

## Emergency Contacts

Keep these handy during deployment:

- **DevOps Lead**: [Contact]
- **Database Admin**: [Contact]
- **On-Call Engineer**: [Contact]
- **Platform Support**: [Support Link]

## Common Issues & Solutions

### Issue: Build Fails

**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Issue: Database Connection Fails

**Solution:**
- Verify `POSTGRES_URL` is correct
- Check database is accessible
- Verify connection pool settings
- Check firewall rules

### Issue: High Error Rate After Deploy

**Solution:**
1. Check error logs immediately
2. If critical, rollback
3. If minor, monitor closely
4. Prepare hotfix if needed

### Issue: Slow Performance

**Solution:**
- Check database query performance
- Verify caching is working
- Check CDN configuration
- Review recent code changes

## Deployment Frequency

- **Staging**: Multiple times per day
- **Production**: Weekly or as needed
- **Hotfixes**: As required
- **Major Releases**: Monthly

## Metrics to Track

After each deployment, track:

- Deployment duration
- Downtime (if any)
- Error rate change
- Performance impact
- User feedback
- Rollback rate

## Continuous Improvement

After deployment:

- [ ] Review what went well
- [ ] Document what could improve
- [ ] Update this checklist
- [ ] Share learnings with team
- [ ] Automate manual steps

---

## Quick Reference

### Essential Commands

```bash
# Test everything
pnpm test:all

# Lint and format
pnpm lint:fix

# Build
pnpm build

# Deploy (Vercel)
git push origin main

# Rollback (Vercel)
vercel rollback

# View logs
vercel logs

# Check status
curl https://your-domain.com/api/health
```

### Version Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Push tag to GitHub
5. Create GitHub release
6. Deploy to production

---

**Last Updated**: 2024-11-10  
**Version**: 3.0.24  
**Maintainer**: DevOps Team
