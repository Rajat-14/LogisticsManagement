FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["backend/services/delivery-verification/DeliveryVerification.csproj", "backend/services/delivery-verification/"]
COPY ["data-layer/Logistics.Data/Logistics.Data.csproj", "data-layer/Logistics.Data/"]
RUN dotnet restore "backend/services/delivery-verification/DeliveryVerification.csproj"
COPY . .
WORKDIR "/src/backend/services/delivery-verification"
RUN dotnet build "DeliveryVerification.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "DeliveryVerification.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "DeliveryVerification.dll"]
