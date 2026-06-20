# Use official Node image
FROM node:18-alpine

# Set the working directory directly to your actual dashboard folder
WORKDIR /workspace/apex_frontend/admin-dashboard

# Copy package files and install dependencies
COPY apex_frontend/admin-dashboard/package*.json ./
RUN npm install

# Copy the rest of the dashboard files
COPY apex_frontend/admin-dashboard/ ./

# Build the Next.js/frontend app
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["npm", "run", "start"]