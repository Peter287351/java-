## 反向代理与负载均衡

### 是什么
Nginx 放在应用前面：对外统一暴露 80/443，对内用 `proxy_pass http://127.0.0.1:8080` 转发；`upstream` 定义多个后端实例做负载均衡，`location` 按路径匹配静态资源或接口。

### 怎么用
典型配置：`location /api/ { proxy_pass http://backend; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }`。静态资源直接由 Nginx 返回，动态请求才转给 Java 应用。

### 常见坑
- `proxy_pass` 末尾带不带斜杠会改变转发后的 URI 路径，是最常见的 404 原因。
- 不设置 Host / X-Forwarded-* 头，应用拿不到真实客户端 IP 与协议。
- upstream 里某个实例挂了会报 502，先看后端进程与端口，不要只盯着 Nginx。

### 面试怎么问
「Nginx 反向代理和正向代理的区别？」答反向代理代表服务端、客户端无感知；正向代理代表客户端。

## 域名、HTTPS 与放行

### 是什么
域名通过 DNS A 记录指向服务器公网 IP；HTTPS 在 443 端口用 TLS 证书加密，证书由 CA 签发（如 Let's Encrypt）。80 端口常做 HTTP → HTTPS 跳转。

### 怎么用
证书放 `/etc/nginx/certs/`，server 块监听 443 ssl 并指定 `ssl_certificate` / `ssl_certificate_key`；同时放行云安全组与系统防火墙的 80/443。

### 常见坑
- 证书过期或域名不匹配会报 NET::ERR_CERT_*，与后端无关。
- 只配了 Nginx 没放行安全组，表现是「外网连不上」，本机 curl 却正常。
- 后端拿到的 scheme 仍是 http 时，要在代理头里传 `X-Forwarded-Proto`，否则生成的重定向链接会错。

### 面试怎么问
「上了 HTTPS 后应用里 request.getScheme() 还是 http？」答反向代理终止了 TLS，需要透传 X-Forwarded-Proto 并让 Spring 解析。

## 动手清单
1. 写一个最小 server 块把 80 端口请求转发到本机 8080，用 curl -I 观察响应头。
2. 故意把 proxy_pass 末尾斜杠去掉一次，对比后端收到的 URI；自测标准：能解释 404 是怎么来的。
