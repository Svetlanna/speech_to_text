FROM nginx:1.30-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html

RUN rm /usr/share/nginx/html/nginx.conf

EXPOSE 80