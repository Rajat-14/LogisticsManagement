FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["backend/services/route-service/RouteService.csproj", "backend/services/route-service/"]
COPY ["data-layer/Logistics.Data/Logistics.Data.csproj", "data-layer/Logistics.Data/"]
RUN dotnet restore "backend/services/route-service/RouteService.csproj"
COPY . .
WORKDIR "/src/backend/services/route-service"
RUN dotnet build "RouteService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RouteService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "RouteService.dll"]
