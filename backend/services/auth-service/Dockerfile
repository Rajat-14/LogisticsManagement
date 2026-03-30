FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy projects to restore
COPY ["backend/services/auth-service/AuthService.csproj", "backend/services/auth-service/"]
COPY ["data-layer/Logistics.Data/Logistics.Data.csproj", "data-layer/Logistics.Data/"]

# Restore
RUN dotnet restore "backend/services/auth-service/AuthService.csproj"

# Copy all source files
COPY . .

# Build
WORKDIR "/src/backend/services/auth-service"
RUN dotnet build "AuthService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AuthService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuthService.dll"]
