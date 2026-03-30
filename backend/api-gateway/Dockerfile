FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy projects to restore
COPY ["backend/api-gateway/api-gateway.csproj", "backend/api-gateway/"]

# Restore
RUN dotnet restore "backend/api-gateway/api-gateway.csproj"

# Copy all source files
COPY . .

# Build
WORKDIR "/src/backend/api-gateway"
RUN dotnet build "api-gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "api-gateway.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "api-gateway.dll"]
