FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/services/tracking-service/TrackingService.csproj", "backend/services/tracking-service/"]
COPY ["data-layer/Logistics.Data/Logistics.Data.csproj", "data-layer/Logistics.Data/"]

RUN dotnet restore "backend/services/tracking-service/TrackingService.csproj"

COPY . .

WORKDIR "/src/backend/services/tracking-service"
RUN dotnet build "TrackingService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TrackingService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TrackingService.dll"]
