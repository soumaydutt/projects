FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/Excalibur.Domain/Excalibur.Domain.csproj src/Excalibur.Domain/
COPY src/Excalibur.Application/Excalibur.Application.csproj src/Excalibur.Application/
COPY src/Excalibur.Infrastructure/Excalibur.Infrastructure.csproj src/Excalibur.Infrastructure/
COPY src/Excalibur.Api/Excalibur.Api.csproj src/Excalibur.Api/

RUN dotnet restore src/Excalibur.Api/Excalibur.Api.csproj

# Copy everything else and build
COPY . .
RUN dotnet build src/Excalibur.Api/Excalibur.Api.csproj -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish src/Excalibur.Api/Excalibur.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "Excalibur.Api.dll"]
