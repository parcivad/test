FROM rust:1-alpine AS bau
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY apps/api-rust/Cargo.toml ./
COPY apps/api-rust/src ./src
RUN cargo build --release

FROM alpine:3
COPY --from=bau /app/target/release/api-rust /usr/local/bin/api-rust
EXPOSE 8082
CMD ["api-rust"]
