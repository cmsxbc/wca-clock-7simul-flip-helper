# Clock 7simul Flip 学习助手

一个用于练习 WCA Clock `7simul flip` 的纯前端小工具：

- 生成/输入打乱并渲染状态
- 计算 `7simul flip` 记忆编码
- 模拟执行步骤（含闭环校验）
- 可选显示每一步状态图、前态虚线指针、编码推导表

## 本地使用

这是一个无需构建的静态页面项目，直接在浏览器打开 `index.html` 即可。

如果你希望用本地服务器访问（推荐）：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 测试

项目使用 Node 内置测试运行器：

```bash
node --test
```

## CI / Pages

- `.github/workflows/test.yml`：在 `push` / `pull_request` 时自动运行测试
- `.github/workflows/pages.yml`：将当前静态站点部署到 GitHub Pages

## 说明

本工具用于 7simul flip 学习与自检。正式比赛请以 WCA 官方打乱程序为准。
