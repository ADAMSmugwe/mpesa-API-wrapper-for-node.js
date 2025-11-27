# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-27

### Added
- 🎉 Initial release of Adams MPesa SDK
- ✨ Full TypeScript support with complete type definitions
- 🔐 OAuth token management with automatic caching and refresh
- 💳 STK Push (Lipa Na M-Pesa Online) implementation
- 💰 C2B Payments with URL registration and simulation
- 💸 B2C Payments for sending money to customers
- 📊 Transaction Status query functionality
- 🔄 Automatic retry logic with exponential backoff (3 attempts)
- ✅ Input validation for phone numbers, amounts, URLs, and shortcodes
- 🎯 12 custom error types for specific scenarios
- 📱 Phone number formatting supporting multiple formats
- 🌍 Sandbox and production environment support
- 📝 Comprehensive documentation and README
- 🧪 49 unit tests with full coverage
- 📦 Dual module system (CommonJS and ESM)

### Production Features
- 🛡️ Express middleware for STK Push and C2B callbacks
- 🔐 Callback signature verification using HMAC SHA256
- 🔄 Retry logic with configurable attempts and backoff
- ✅ Validation helpers (validateKenyanPhoneNumber, validatePositiveAmount, etc.)
- 📚 Complete examples folder with working demos:
  - Express STK Push server
  - Callback handling with middleware
  - Error handling strategies
- 🔒 Security best practices documentation
- 📖 Examples documentation in `/examples/README.md`

### Developer Experience
- TypeScript 5.3+ with strict type checking
- Comprehensive error messages
- Debug-friendly logging with sensitive data sanitization
- ESLint and Prettier configuration
- Jest testing framework setup
- Automated build process

### Documentation
- Complete README with usage examples
- Quick start guide
- API configuration reference
- Error handling guide
- Security best practices
- Callback/webhook handling guide
- Testing guide

[1.0.0]: https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js/releases/tag/v1.0.0
