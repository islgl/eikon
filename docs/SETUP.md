# Supabase 设置指南

## 1. 创建 Supabase 项目

前往 [supabase.com](https://supabase.com) 新建 project，等待初始化完成。

## 2. 配置环境变量

进入 **Settings → API**，复制以下内容填入项目根目录的 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Settings → API → service_role
```

## 3. 初始化数据库

在 **SQL Editor** 中，粘贴并运行 `supabase/migrations/0001_init.sql` 的完整内容。

这会创建以下表结构：
- `collections` — 图标集（支持嵌套）
- `icons` — 图标（含 SVG 内容 + 存储路径）
- `tags` / `icon_tags` — 标签系统

以及所有必要的 RLS 策略和索引。

## 4. 创建 Storage Bucket

在 **Storage** 中新建 bucket：
- 名称：`icons`
- Public：**关闭**（private）

然后在 **SQL Editor** 执行以下 RLS 策略：

```sql
create policy "Users access own icon files" on storage.objects
  for all using (auth.uid()::text = (storage.foldername(name))[1]);
```

## 5. 启用邮件登录

进入 **Authentication → Providers → Email**：
- 确保已启用
- 推荐开启 **Confirm email**（即魔法链接登录）

## 6. 本地启动

```bash
npm run dev
# 访问 http://localhost:3000
```

首次访问会跳转到登录页，输入邮箱后会收到魔法链接邮件，点击链接即可登录。
