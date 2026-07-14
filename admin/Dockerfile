FROM node:20-alpine
WORKDIR /app

RUN echo "# force-rebuild-v3"
COPY . .
RUN npm install

# Railway passes all service env-vars as Docker build args automatically.
# Declare them here so Vite can bake VITE_* values into the JS bundle at build time.
# Without ARG+ENV, import.meta.env.VITE_API_URL is undefined and the app
# falls back to http://localhost:5000/api, causing "Failed to fetch" in browsers.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

EXPOSE 8080

# Overwrite vite.config.js at startup so the correct PORT and allowedHosts
# are always used regardless of what the cached build image contains.
# vite preview only needs the preview block — plugins aren't used at serve time.
CMD ["sh", "-c", "echo 'import{defineConfig}from\"vite\";export default defineConfig({base:\"/admin\",preview:{host:true,port:parseInt(process.env.PORT)||8080,allowedHosts:true}});' > vite.config.js && npm run preview"]
