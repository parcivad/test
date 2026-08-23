FROM python:3.12-alpine
WORKDIR /app
COPY services/api-python/pyproject.toml ./
COPY services/api-python/api_python ./api_python
RUN pip install --no-cache-dir "psycopg[binary]>=3.2"
EXPOSE 8084
CMD ["python", "-m", "api_python.server"]
