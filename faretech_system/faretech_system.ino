#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <Wire.h>
#include <RTClib.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/semphr.h"

// Pin definitions
const int PIR1_PIN = 13;
const int LED1_PIN = 12;
const int BTN1_PIN = 27;
const int PIR2_PIN = 14;
const int LED2_PIN = 2;
const int BTN2_PIN = 26;
const int RTC_SDA = 21;
const int RTC_SCL = 22;
const int RTC_INT = 15;

// WiFi credentials
const char* ssid = "Roman Bruyne#10";
const char* password = "@eugine#";

// Supabase configuration
const char* SUPABASE_URL = "https://pwozbnrrxutpywcumhip.supabase.co";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3b3pibnJyeHV0cHl3Y3VtaGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MTc1ODYsImV4cCI6MjA1MTM5MzU4Nn0.949qs-1HGf2QUczEQbSN2WEI9nVi5R8pZIxfHnQLv8E";

// Global objects
WebServer server(80);
TinyGPSPlus gps;
RTC_DS3231 rtc;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// FreeRTOS handles
TaskHandle_t gpsTaskHandle = NULL;
TaskHandle_t seatTaskHandle = NULL;
TaskHandle_t webServerTaskHandle = NULL;
TaskHandle_t fareCalculationTaskHandle = NULL;
QueueHandle_t fareQueue = NULL;
SemaphoreHandle_t wireMutex = NULL;
SemaphoreHandle_t fareMutex = NULL;

// Fare calculation constants
const float BASE_FARE = 50.0;  // Base fare in KSH
const float PEAK_MULTIPLIER = 1.5;
const float DISTANCE_RATE = 10.0;  // KSH per km

// Structs
struct Location {
  const char* name;
  float lat;
  float lng;
};

struct FareData {
  int seatNumber;
  const Location* from;
  const Location* to;
  float amount;
  bool isPeak;
};

struct SeatState {
  bool occupied;
  bool buttonState;
  bool disconnected;
  const Location* fromLocation;
  const Location* toLocation;
  unsigned long occupiedTime;
};

// Predefined locations
const Location LOCATIONS[] = {
  {"KU", -1.180, 36.939},
  {"Kahawa Sukari", -1.189, 36.931},
  {"Kahawa Wendani", -1.196, 36.923},
  {"Allsops", -1.244, 36.867},
  {"Odeon", -1.283, 36.825}
};

// Global variables
SeatState seats[2] = {
  {false, false, false, nullptr, nullptr, 0},
  {false, false, false, nullptr, nullptr, 0}
};
float totalFare = 0;

// Function declarations
void setupWiFi();
void setupRTC();
void handleRoot();
void handleSeatStatus();
const Location* findNearestLocation(float lat, float lng);
bool isPeakHour();
float calculateDistance(const Location* from, const Location* to);
void updateFareTotal(float amount);
void sendToSupabase(const FareData& data);

// FreeRTOS task functions
void gpsTask(void* parameter);
void seatTask(void* parameter);
void webServerTask(void* parameter);
void fareCalculationTask(void* parameter);

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600);

  // Create FreeRTOS resources
  fareQueue = xQueueCreate(10, sizeof(FareData));
  wireMutex = xSemaphoreCreateMutex();
  fareMutex = xSemaphoreCreateMutex();

  // Initialize hardware
  Wire.begin(RTC_SDA, RTC_SCL);
  setupRTC();
  setupWiFi();

  // Initialize pins
  pinMode(PIR1_PIN, INPUT);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(BTN1_PIN, INPUT_PULLUP);
  pinMode(PIR2_PIN, INPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(BTN2_PIN, INPUT_PULLUP);

  // Initialize LCD
  xSemaphoreTake(wireMutex, portMAX_DELAY);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("FareTech System");
  xSemaphoreGive(wireMutex);

  // Create FreeRTOS tasks
  xTaskCreatePinnedToCore(gpsTask, "GPS Task", 4096, NULL, 1, &gpsTaskHandle, 0);
  xTaskCreatePinnedToCore(seatTask, "Seat Task", 4096, NULL, 2, &seatTaskHandle, 0);
  xTaskCreatePinnedToCore(webServerTask, "Web Server", 4096, NULL, 1, &webServerTaskHandle, 1);
  xTaskCreatePinnedToCore(fareCalculationTask, "Fare Calc", 4096, NULL, 2, &fareCalculationTaskHandle, 1);
}

void loop() {
  // Empty - tasks handle everything
  vTaskDelete(NULL);
}

float calculateDistance(const Location* from, const Location* to) {
  if (!from || !to) return 0;
  
  float lat1 = from->lat * PI / 180;
  float lon1 = from->lng * PI / 180;
  float lat2 = to->lat * PI / 180;
  float lon2 = to->lng * PI / 180;
  
  float R = 6371; // Earth's radius in km
  float dlat = lat2 - lat1;
  float dlon = lon2 - lon1;
  
  float a = sin(dlat/2) * sin(dlat/2) +
            cos(lat1) * cos(lat2) * 
            sin(dlon/2) * sin(dlon/2);
  float c = 2 * atan2(sqrt(a), sqrt(1-a));
  
  return R * c; // Distance in km
}

void calculateFare(int seatNum, const Location* from, const Location* to) {
  if (!from || !to) return;

  float distance = calculateDistance(from, to);
  float fare = BASE_FARE + (distance * DISTANCE_RATE);
  
  if (isPeakHour()) {
    fare *= PEAK_MULTIPLIER;
  }

  FareData fareData = {
    seatNum,
    from,
    to,
    fare,
    isPeakHour()
  };

  xQueueSend(fareQueue, &fareData, portMAX_DELAY);
}

void fareCalculationTask(void* parameter) {
  FareData fareData;
  
  while (true) {
    if (xQueueReceive(fareQueue, &fareData, portMAX_DELAY) == pdTRUE) {
      xSemaphoreTake(fareMutex, portMAX_DELAY);
      totalFare += fareData.amount;
      
      // Update LCD
      xSemaphoreTake(wireMutex, portMAX_DELAY);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.printf("Seat %d Fare:", fareData.seatNumber);
      lcd.setCursor(0, 1);
      lcd.printf("Ksh %.2f", fareData.amount);
      xSemaphoreGive(wireMutex);
      
      // Send to Supabase
      sendToSupabase(fareData);
      
      xSemaphoreGive(fareMutex);
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void sendToSupabase(const FareData& data) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/fare_transactions");
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));

  StaticJsonDocument<256> doc;
  doc["from_location"] = data.from->name;
  doc["to_location"] = data.to->name;
  doc["amount"] = data.amount;
  doc["is_peak"] = data.isPeak;
  doc["seat_number"] = data.seatNumber;

  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    // Update fare summation
    http.begin(String(SUPABASE_URL) + "/rest/v1/fare_summation");
    
    StaticJsonDocument<128> sumDoc;
    sumDoc["total_amount"] = totalFare;
    
    String sumRequestBody;
    serializeJson(sumDoc, sumRequestBody);
    
    http.POST(sumRequestBody);
  }
  
  http.end();
}

void handleSeat(int seatNum, int pirPin, int ledPin, int btnPin, SeatState& seat) {
  // Check PIR sensor connection
  seat.disconnected = !digitalRead(pirPin);
  
  if (seat.disconnected) {
    digitalWrite(ledPin, HIGH);
    return;
  }

  // Read button state
  bool currentBtnState = !digitalRead(btnPin);
  
  if (currentBtnState != seat.buttonState) {
    seat.buttonState = currentBtnState;
    
    if (currentBtnState) {
      digitalWrite(ledPin, HIGH);
      
      if (gps.location.isValid()) {
        float lat = round(gps.location.lat() * 1000) / 1000.0;
        float lng = round(gps.location.lng() * 1000) / 1000.0;
        const Location* loc = findNearestLocation(lat, lng);
        
        if (loc) {
          if (!seat.occupied) {
            seat.fromLocation = loc;
            xSemaphoreTake(wireMutex, portMAX_DELAY);
            lcd.clear();
            lcd.print("From: ");
            lcd.print(loc->name);
            xSemaphoreGive(wireMutex);
          } else {
            seat.toLocation = loc;
            calculateFare(seatNum, seat.fromLocation, loc);
          }
        }
      }
    } else {
      digitalWrite(ledPin, LOW);
    }
  }

  // Handle occupancy
  if (!seat.disconnected && digitalRead(pirPin) == HIGH && seat.buttonState) {
    if (!seat.occupied) {
      seat.occupied = true;
      seat.occupiedTime = millis();
      
      xSemaphoreTake(wireMutex, portMAX_DELAY);
      lcd.clear();
      lcd.printf("Seat %d Occupied", seatNum);
      xSemaphoreGive(wireMutex);
    }
  }
}

void handleSeatStatus() {
  StaticJsonDocument<256> doc;
  JsonArray seatArray = doc.createNestedArray("seats");
  
  for (int i = 0; i < 2; i++) {
    JsonObject seatObj = seatArray.createNestedObject();
    seatObj["id"] = i + 1;
    seatObj["occupied"] = seats[i].occupied;
    seatObj["disconnected"] = seats[i].disconnected;
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// ... (rest of the existing functions remain the same)