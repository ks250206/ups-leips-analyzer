FROM node:24-bookworm AS web-build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM golang:1.26-bookworm AS go-build
WORKDIR /app
COPY go.mod ./
COPY main.go ./
COPY --from=web-build /app/dist ./dist
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/ups-leips-analyzer .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=go-build /out/ups-leips-analyzer /ups-leips-analyzer
EXPOSE 4173
ENTRYPOINT ["/ups-leips-analyzer"]
CMD ["--host", "0.0.0.0", "--port", "4173"]
