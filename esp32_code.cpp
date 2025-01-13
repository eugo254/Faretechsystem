#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <Wire.h>
#include <RTClib.h>
#include <LiquidCrystal_I2C.h>

// Pin definitions
const int PIR1_PIN = 13;  // D13
const int LED1_PIN = 12;  // D12
const int BTN1_PIN = 27;  // D27
const int PIR2_PIN = 14;  // D14
const int LED2_PIN = 2;   // D2
const int BTN2_PIN = 26;  // D26
const int RTC_SDA = 21;   // D21
const int RTC_SCL = 22;   // D22
const int RTC_INT = 15;   // D15

// WiFi credentials
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// Global objects
WebServer server(80);
TinyGPSPlus gps;
RTC_DS3231 rtc;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Predefined locations
struct Location {
  const char* name;
  float lat;
  float lng;
};

const Location LOCATIONS[] = {
  {"KU", -1.180, 36.939},
  {"Kahawa Sukari", -1.189, 36.931},
  {"Kahawa Wendani", -1.196, 36.923},
  {"Allsops", -1.244, 36.867},
  {"Odeon", -1.283, 36.825}
};

// Global variables
struct SeatState {
  bool occupied;
  bool buttonState;
  Location fromLocation;
  Location toLocation;
  unsigned long occupiedTime;
};

SeatState seat1 = {false, false, {"", 0, 0}, {"", 0, 0}, 0};
SeatState seat2 = {false, false, {"", 0, 0}, {"", 0, 0}, 0};
float totalFare = 0;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600);  // GPS on TX2/RX2

  // Initialize pins
  pinMode(PIR1_PIN, INPUT);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(BTN1_PIN, INPUT_PULLUP);
  pinMode(PIR2_PIN, INPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(BTN2_PIN, INPUT_PULLUP);

  // Initialize I2C devices
  Wire.begin(RTC_SDA, RTC_SCL);
  if (!rtc.begin()) {
    Serial.println("RTC failed");
  }
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Faretech System");
  lcd.setCursor(0, 1);
  lcd.print("by Makori");
  delay(2000);

  setupWiFi();
  setupServer();
}

void loop() {
  server.handleClient();
  handleGPS();
  handleSeats();
}

void handleGPS() {
  while (Serial2.available() > 0) {
    if (gps.encode(Serial2.read())) {
      if (gps.location.isValid()) {
        // Round to 3 decimal places
        float lat = round(gps.location.lat() * 1000) / 1000.0;
        float lng = round(gps.location.lng() * 1000) / 1000.0;
        checkLocation(lat, lng);
      }
    }
  }
}

const Location* findNearestLocation(float lat, float lng) {
  for (const auto& loc : LOCATIONS) {
    if (abs(loc.lat - lat) < 0.001 && abs(loc.lng - lng) < 0.001) {
      return &loc;
    }
  }
  return nullptr;
}

void handleSeats() {
  // Handle Seat 1
  handleSeat(1, PIR1_PIN, LED1_PIN, BTN1_PIN, seat1);
  
  // Handle Seat 2
  handleSeat(2, PIR2_PIN, LED2_PIN, BTN2_PIN, seat2);
}

void handleSeat(int seatNum, int pirPin, int ledPin, int btnPin, SeatState& seat) {
  // Read button state
  bool currentBtnState = !digitalRead(btnPin);  // Active LOW
  
  if (currentBtnState != seat.buttonState) {
    seat.buttonState = currentBtnState;
    
    if (currentBtnState) {  // Button pressed
      digitalWrite(ledPin, HIGH);
      
      if (gps.location.isValid()) {
        float lat = round(gps.location.lat() * 1000) / 1000.0;
        float lng = round(gps.location.lng() * 1000) / 1000.0;
        const Location* loc = findNearestLocation(lat, lng);
        
        if (loc) {
          if (!seat.occupied) {
            seat.fromLocation = *loc;
            lcd.clear();
            lcd.print("From: ");
            lcd.print(loc->name);
          } else {
            seat.toLocation = *loc;
            calculateFare(seat);
          }
        } else {
          lcd.clear();
          lcd.print("Invalid location");
        }
      }
    } else {  // Button released
      digitalWrite(ledPin, LOW);
    }
  }

  // Handle PIR sensor
  if (digitalRead(pirPin) == HIGH && seat.buttonState) {
    if (!seat.occupied) {
      seat.occupied = true;
      seat.occupiedTime = millis();
      lcd.clear();
      lcd.print("Seat ");
      lcd.print(seatNum);
      lcd.print(" Occupied");
    }
  }
}

void calculateFare(SeatState& seat) {
  // This should be implemented to calculate fare based on from/to locations
  // and peak/off-peak hours, then update totalFare
  // The actual fare calculation would be based on your pricing rules
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Total Fare:");
  lcd.setCursor(0, 1);
  lcd.print("Ksh. ");
  lcd.print(totalFare, 2);
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void setupServer() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/seatStatus", HTTP_GET, handleSeatStatus);
  server.begin();
}

void handleRoot() {
  String html = "<h1>Bus Fare System</h1>";
  server.send(200, "text/html", html);
}

void handleSeatStatus() {
  StaticJsonDocument<200> doc;
  JsonArray seatArray = doc.createNestedArray("seats");
  
  JsonObject seat1Obj = seatArray.createNestedObject();
  seat1Obj["id"] = 1;
  seat1Obj["occupied"] = seat1.occupied;
  
  JsonObject seat2Obj = seatArray.createNestedObject();
  seat2Obj["id"] = 2;
  seat2Obj["occupied"] = seat2.occupied;
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}