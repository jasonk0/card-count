FROM node:22-alpine as frontend-build

WORKDIR /app

# 复制前端项目文件
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 后端构建阶段
FROM node:22-alpine as backend-build

WORKDIR /app/server

# 复制服务端项目文件
COPY server/package*.json ./
RUN npm install

COPY server .

# 生产阶段
FROM node:22-alpine

# 创建应用目录
WORKDIR /app

# 复制后端应用
COPY --from=backend-build /app/server /app/server

# 复制前端构建产物
COPY --from=frontend-build /app/dist /app/client

# 安装生产环境依赖
WORKDIR /app/server
RUN npm ci --only=production

# 创建必要的目录
RUN mkdir -p /app/server/data /app/server/uploads

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000
ENV STATIC_PATH=/app/client

# 启动命令
CMD ["node", "index.js"] 