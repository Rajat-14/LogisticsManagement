FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/services/order-service/OrderService.csproj", "backend/services/order-service/"]
COPY ["data-layer/Logistics.Data/Logistics.Data.csproj", "data-layer/Logistics.Data/"]

RUN dotnet restore "backend/services/order-service/OrderService.csproj"

COPY . .

WORKDIR "/src/backend/services/order-service"
RUN dotnet build "OrderService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "OrderService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OrderService.dll"]
