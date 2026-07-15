FROM node:20-alpine AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Боевой GTM-контейнер; вшивается в бандл при сборке. Пустое значение = GTM выключен.
ARG VITE_GTM_ID
ENV VITE_GTM_ID=$VITE_GTM_ID
RUN pnpm run api && pnpm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
