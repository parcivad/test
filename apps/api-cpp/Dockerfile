FROM alpine:3 AS bau
RUN apk add --no-cache g++ cmake make libpq-dev
WORKDIR /app
COPY apps/api-cpp/CMakeLists.txt ./
COPY apps/api-cpp/src ./src
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j

FROM alpine:3
RUN apk add --no-cache libpq libstdc++
COPY --from=bau /app/build/api_cpp /usr/local/bin/api_cpp
EXPOSE 8083
CMD ["api_cpp"]
