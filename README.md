![Veve Banner](./assets/banner.png)

<div align="center">
  <img src="https://img.shields.io/npm/v/veve" alt="npm version">
  <img src="https://img.shields.io/npm/l/veve" alt="License">
  <img src="https://img.shields.io/npm/dm/veve" alt="Downloads">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/github/contributors/tinytools-oss/veve" alt="Contributors">
  <img src="https://img.shields.io/node/v/veve" alt="Node.js Version">
  <img src="https://github.com/solo-fox/veve/actions/workflows/test.yml/badge.svg" alt="veve status" />
  <br />
  <br />
  <p><strong>A zero-config, type-safe, TypeScript-native testing framework and runner!</strong></p>
</div>

---

### Install

```bash
$ npm install -g veve
```

Or use the wizard

```bash
$ npx veve-setup
```

---

### 🚀 Quick Start

#### Step 1: Write Your Tests in TypeScript

```typescript
import { assert } from "veve";

it("should add two numbers", () => {
  const add = (a: number, b: number): number => a + b;
  // Enjoy TypeScript autocomplete!
  assert(add(1, 2)).toBe(3);
});

run();
```

#### Step 2: Run `veve`

```bash
$ veve
```

#### Step 3: Celebrate Your Simplicity! 🎉

No additional steps—just fast, type-safe tests.

---

### 🌟 Features

- **Type-Safe**: Fully integrated with TypeScript.
- **Bring Your Own Assertion Library**: Use the built-in assertions or your favorite library.
- **Fast and Lightweight**: Minimal yet powerful.
- **Isolation**: Complete control with customizable VM contexts and esbuild plugins.
- **Simple Setup**: Zero config.
-

### 🔒 Limitations

- **No Top-Level Await**: Currently unsupported.
- **No Built-In Mocking**: Encourages the use of libraries like `proxyquire`.
- **No Snapshots**: This feature is planned for future versions.

---

### 📚 Resources

- **GitHub**: [https://github.com/solo-fox/veve](https://github.com/solo-fox/veve)
- **Homepage**: [https://veveoss.vercel.app](https://veveoss.vercel.app)

---

### 🛠 Contributing

PRs are welcome! For feature requests or bug reports, feel free to open an issue on GitHub. Let's build the best testing framework together!
