# Blue Land

一个用 Jekyll 写的简洁个人博客，直接部署在 GitHub Pages 上，免费，不需要服务器。

## 文件夹里都有什么

| 位置 | 作用 |
| --- | --- |
| `_posts/` | 文章，一篇一个 Markdown 文件 |
| `about.md` | “关于”页，改成你自己的介绍 |
| `_config.yml` | 站点名称、主页 slogan、网址等设置 |
| `posts.html` | 文章列表页 |
| `_layouts/`、`_includes/` | 页面模板 |
| `assets/css/style.css` | 样式（颜色、字体、排版） |
| `feed.xml` | 不用管，RSS 会自动生成 |

## 改主页那句 slogan

打开 `_config.yml`，改 `slogan:` 后面那句话就行。`slogan_lang:` 写这句话的语言（`fr` 法语、`en` 英语时用斜体衬线字；中文就删掉这一行）。

## 怎么写新文章

1. 在 `_posts/` 里新建文件，文件名格式：`年-月-日-英文短名.md`，例如 `2026-11-12-yunnan-day-1.md`。
2. 文件开头写头信息：

   ```yaml
   ---
   title: 文章标题
   date: 2026-11-12 20:00:00 +0800
   tags: [旅行]
   ---
   ```

3. 下面用 Markdown 写正文。英文文章在头信息里加 `lang: en`。
4. 提交到 GitHub，一两分钟后网站自动更新。

最省事的办法是直接在 GitHub 网页上操作：打开仓库的 `_posts` 文件夹 → **Add file** → **Create new file** → 写完点 **Commit changes**。手机上也能这样写。

图片放进 `assets/images/`，文章里用 `![说明](/assets/images/xxx.jpg)` 引用。

## 怎么部署到 GitHub Pages

1. 在 GitHub 新建一个仓库：
   - 叫 `blue-land`：网址是 `https://<用户名>.github.io/blue-land/`
   - 叫 `<用户名>.github.io`：网址是 `https://<用户名>.github.io/`
2. 打开 `_config.yml`，按上面的选择填 `url` 和 `baseurl`。
3. 把这个文件夹里的所有文件上传到仓库。
4. 仓库 **Settings** → **Pages** → **Build and deployment**，Source 选 **Deploy from a branch**，分支选 `main`、文件夹选 `/ (root)`，保存。
5. 等一两分钟，打开上面的网址就能看到。

## 在自己电脑上预览（可选）

装好 Ruby 后，在这个文件夹里运行：

```
bundle install
bundle exec jekyll serve
```

然后打开 http://localhost:4000 。
