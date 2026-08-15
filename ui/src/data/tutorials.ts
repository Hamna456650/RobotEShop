/**
 * Sample tutorial library.
 *
 * The scraper leaves `tutorial_videos` / `getting_started_guide` empty on
 * purpose — the source sites do not carry them, and that gap is the product's
 * stated differentiator. Until an editorial pass fills them, this file stands
 * in so the page can be designed against realistic content.
 *
 * Everything here is real hardware from `ui/public/images`, priced at plausible
 * Pakistani retail. Swap this module for a `/tutorials` fetch when the
 * editorial layer exists — nothing else on the page reads the data directly.
 */

import { Tutorial } from '../types';

const IMG = '/images/';

export const tutorials: Tutorial[] = [
  {
    id: 'obstacle-car',
    title: 'Build a 2WD car that steers around what it bumps into',
    summary:
      'Two geared motors, one distance sensor, and the loop that decides when to turn. The first build where the parts stop being separate parts.',
    image: IMG + '2WD_RC_Car_Obstacle_Avoidance_HC_SR04_Smart_Robot_Car_Kit_For_Arduino.jpg',
    format: 'guide',
    level: 'Intermediate',
    category: 'Robot kits',
    platforms: ['Arduino'],
    runtimeSec: null,
    steps: 9,
    verifiedBuild: true,
    parts: [
      { name: '2WD chassis, motors and wheels', qty: 1, price: 950 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: 'HC-SR04 ultrasonic sensor', qty: 1, price: 180 },
      { name: 'L298N motor driver', qty: 1, price: 380 },
      { name: '18650 cell', qty: 2, price: 300 },
      { name: 'Jumper wires, male to female', qty: 1, price: 150 },
    ],
  },
  {
    id: 'hc-sr04',
    title: 'Measure distance with an HC-SR04',
    summary:
      'Send a pulse, time the echo, divide by two. The sensor behind almost every hobby robot that avoids a wall.',
    image: IMG + 'Ultrasonic_Sensor_HC_SR04_Distance_Measuring_Sensor.jpg',
    format: 'video',
    level: 'Beginner',
    category: 'Sensors',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: 760,
    steps: 5,
    verifiedBuild: true,
    parts: [
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: 'HC-SR04 ultrasonic sensor', qty: 1, price: 180 },
      { name: 'Breadboard, 400 points', qty: 1, price: 190 },
      { name: 'Jumper wires, male to male', qty: 1, price: 150 },
    ],
  },
  {
    id: 'l298n-motors',
    title: 'Drive two DC motors with an L298N',
    summary:
      'Direction on two pins, speed on a third. Also why the motor supply and the board supply are not the same wire.',
    image: IMG + 'L298_H_Bridge_Motor_Driver_Module.jpg',
    format: 'wiring',
    level: 'Beginner',
    category: 'Motors & actuators',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: null,
    steps: 6,
    verifiedBuild: true,
    parts: [
      { name: 'L298N motor driver', qty: 1, price: 380 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: 'Geared DC motor with wheel', qty: 2, price: 350 },
    ],
  },
  {
    id: 'dht22',
    title: 'Read temperature and humidity with a DHT22',
    summary:
      'One data pin, one library, and a two-second wait the datasheet insists on. Print both readings to the serial monitor.',
    image: IMG + 'DHT22_Temperature_and_Humidity_Sensor_Module.webp',
    format: 'video',
    level: 'Beginner',
    category: 'Sensors',
    platforms: ['Arduino', 'ESP32', 'Raspberry Pi'],
    runtimeSec: 555,
    steps: 4,
    verifiedBuild: true,
    parts: [
      { name: 'DHT22 temperature and humidity module', qty: 1, price: 650 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: 'Jumper wires, male to female', qty: 1, price: 150 },
    ],
  },
  {
    id: 'esp32-wifi',
    title: 'Put an ESP32 on Wi-Fi and post a reading every minute',
    summary:
      'Join a network, hold the connection, and send a sensor value to an endpoint you control. Where a project stops being local.',
    image: IMG + 'ESP32_WROOM32U_WROVER_Module_WIFI_Module_Suitable_for_IOT_Projects.webp',
    format: 'guide',
    level: 'Intermediate',
    category: 'Controllers',
    platforms: ['ESP32'],
    runtimeSec: null,
    steps: 8,
    verifiedBuild: true,
    parts: [
      { name: 'ESP32 WROOM-32 module', qty: 1, price: 1250 },
      { name: 'DHT22 temperature and humidity module', qty: 1, price: 650 },
      { name: 'Breadboard, 400 points', qty: 1, price: 190 },
    ],
  },
  {
    id: 'servo-pot',
    title: 'Position an SG90 servo with a potentiometer',
    summary:
      'Map a 0–1023 reading onto 0–180 degrees. The first time an input on one side of the board moves something on the other.',
    image: IMG + 'SG90_9G_Servo_Motor_Tower_Pro_with_Accessories_Blue.jpg',
    format: 'video',
    level: 'Beginner',
    category: 'Motors & actuators',
    platforms: ['Arduino'],
    runtimeSec: 450,
    steps: 4,
    verifiedBuild: true,
    parts: [
      { name: 'SG90 9g micro servo', qty: 1, price: 320 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: '10k potentiometer', qty: 1, price: 60 },
      { name: 'Breadboard, 400 points', qty: 1, price: 190 },
    ],
  },
  {
    id: 'line-follower',
    title: 'Follow a line with a pair of TCRT5000 sensors',
    summary:
      'Read reflected infrared off black tape, then steer on the difference between the two sensors. Includes calibrating for room light.',
    image: IMG + 'TCRT5000_Infrared_Reflective_IR_Sensor_Line_Following_Module.jpg',
    format: 'guide',
    level: 'Intermediate',
    category: 'Sensors',
    platforms: ['Arduino'],
    runtimeSec: null,
    steps: 7,
    verifiedBuild: true,
    parts: [
      { name: 'TCRT5000 reflective IR module', qty: 2, price: 160 },
      { name: '2WD chassis, motors and wheels', qty: 1, price: 950 },
      { name: 'L298N motor driver', qty: 1, price: 380 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
    ],
  },
  {
    id: 'lcd-i2c',
    title: 'Print to a 16x2 LCD over I2C using four wires',
    summary:
      'The parallel wiring needs twelve pins. The I2C backpack needs four. Set the address, then write two lines of text.',
    image: IMG + '1604_Display_Module_5V.webp',
    format: 'video',
    level: 'Beginner',
    category: 'Display & audio',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: 490,
    steps: 5,
    verifiedBuild: true,
    parts: [
      { name: '16x2 LCD with I2C backpack', qty: 1, price: 520 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: 'Jumper wires, male to female', qty: 1, price: 150 },
    ],
  },
  {
    id: 'pir-relay',
    title: 'Switch a lamp when a PIR sensor sees movement',
    summary:
      'Tune the two trimmers on an HC-SR501, then drive a relay from the output. Covers the isolation rules for mains work.',
    image: IMG + 'HC_SR501_PIR_Sensor.jpg',
    format: 'guide',
    level: 'Beginner',
    category: 'Sensors',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: null,
    steps: 6,
    verifiedBuild: false,
    parts: [
      { name: 'HC-SR501 PIR motion sensor', qty: 1, price: 210 },
      { name: '1-channel relay module', qty: 1, price: 160 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
    ],
  },
  {
    id: 'hc05-bluetooth',
    title: 'Steer an Arduino from your phone over Bluetooth',
    summary:
      'Pair an HC-05, read single characters off the serial port, and turn each one into a motor command. No app development.',
    image: IMG + 'HC05_Bluetooth_Module.jpg',
    format: 'video',
    level: 'Intermediate',
    category: 'Controllers',
    platforms: ['Arduino'],
    runtimeSec: 880,
    steps: 7,
    verifiedBuild: true,
    parts: [
      { name: 'HC-05 Bluetooth module', qty: 1, price: 750 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: 'L298N motor driver', qty: 1, price: 380 },
      { name: 'Jumper wires, male to female', qty: 1, price: 150 },
    ],
  },
  {
    id: 'mpu6050',
    title: 'Turn raw MPU6050 output into a usable tilt angle',
    summary:
      'The gyro drifts and the accelerometer is noisy. A complementary filter over both gives an angle you can steer on.',
    image: IMG + 'MPU6050_Analog_Gyroscope_Sensor.jpg',
    format: 'guide',
    level: 'Advanced',
    category: 'Sensors',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: null,
    steps: 10,
    verifiedBuild: false,
    parts: [
      { name: 'MPU6050 gyroscope and accelerometer', qty: 1, price: 340 },
      { name: 'Arduino Nano V3', qty: 1, price: 900 },
      { name: 'Breadboard, 400 points', qty: 1, price: 190 },
    ],
  },
  {
    id: 'soil-pump',
    title: 'Water a plant when the soil sensor says it is dry',
    summary:
      'Capacitive rather than resistive, because the resistive kind corrodes in a fortnight. Threshold, pump, and a lockout so it cannot flood.',
    image: IMG + 'Capacitive_Soil_Moisture_Sensor_Module.jpg',
    format: 'video',
    level: 'Intermediate',
    category: 'Sensors',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: 1020,
    steps: 8,
    verifiedBuild: true,
    parts: [
      { name: 'Capacitive soil moisture sensor', qty: 1, price: 280 },
      { name: 'Mini submersible water pump, 5V', qty: 1, price: 450 },
      { name: '1-channel relay module', qty: 1, price: 160 },
      { name: 'Arduino Nano V3', qty: 1, price: 900 },
    ],
  },
  {
    id: 'ws2812',
    title: 'Animate a WS2812 strip without blocking the loop',
    summary:
      'Addressable LEDs, one data line, and why `delay()` ruins every animation you write after the first one.',
    image: IMG + 'WS2812_RGB_LED_Breakout_Module.jpg',
    format: 'video',
    level: 'Beginner',
    category: 'Display & audio',
    platforms: ['Arduino', 'ESP32'],
    runtimeSec: 610,
    steps: 5,
    verifiedBuild: true,
    parts: [
      { name: 'WS2812 RGB LED module', qty: 1, price: 420 },
      { name: 'Arduino Nano V3', qty: 1, price: 900 },
      { name: 'Jumper wires, male to female', qty: 1, price: 150 },
    ],
  },
  {
    id: 'keypad',
    title: 'Wire a 4x4 keypad and read which key was pressed',
    summary:
      'Eight pins, four rows scanned against four columns. The pattern behind every keypad, lock and menu you will build later.',
    image: IMG + '4X4_Matrix_Keypad_for_Arduino.webp',
    format: 'wiring',
    level: 'Beginner',
    category: 'Controllers',
    platforms: ['Arduino'],
    runtimeSec: null,
    steps: 4,
    verifiedBuild: true,
    parts: [
      { name: '4x4 matrix membrane keypad', qty: 1, price: 190 },
      { name: 'Arduino UNO R3', qty: 1, price: 1450 },
      { name: '16x2 LCD with I2C backpack', qty: 1, price: 520 },
    ],
  },
];

/** The tutorial the page leads with. */
export const featuredId = 'obstacle-car';
