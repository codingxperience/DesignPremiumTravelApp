FROM node:24-bookworm-slim AS client
WORKDIR /build
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY index.html vite.mobile.config.ts tsconfig.json ./
COPY public public
COPY src src
RUN pnpm build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/server
COPY server/requirements.txt ./
RUN pip install --no-cache-dir --requirement requirements.txt && useradd --create-home --uid 10001 travel
COPY server/manage.py server/serve.py ./
COPY server/travel travel
COPY --from=client /build/dist /app/dist
RUN TRAVEL_ENV=local python manage.py collectstatic --noinput && rm .local-key
USER travel
EXPOSE 8000
CMD ["python", "serve.py"]
