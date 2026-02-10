// SumUp Bluetooth-Kommunikation
export class SumUpBluetooth {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  // Prüfen ob Web Bluetooth unterstützt wird
  isSupported() {
    return 'bluetooth' in navigator;
  }

  // Mit SumUp-Terminal verbinden
  async connect() {
    try {
      console.log('Suche nach SumUp-Gerät...');
      
      // Nach Bluetooth-Geräten suchen
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'SumUp' },
          { namePrefix: 'SUMUP' }
        ],
        optionalServices: ['battery_service', '00001016-0000-1000-8000-00805f9b34fb']
      });

      console.log('Gerät gefunden:', this.device.name);

      // Mit GATT-Server verbinden
      this.server = await this.device.gatt.connect();
      console.log('Mit GATT-Server verbunden');

      return true;
    } catch (error) {
      console.error('Bluetooth-Verbindungsfehler:', error);
      throw new Error('Verbindung fehlgeschlagen: ' + error.message);
    }
  }

  // Zahlung initiieren
  async initiatePayment(amount) {
    if (!this.server || !this.server.connected) {
      throw new Error('Nicht mit Gerät verbunden');
    }

    try {
      console.log('Initiiere Zahlung:', amount);
      
      // SumUp Service UUID (dies ist ein Beispiel, die echte UUID müsste dokumentiert sein)
      const serviceUUID = '00001016-0000-1000-8000-00805f9b34fb';
      const service = await this.server.getPrimaryService(serviceUUID);
      
      // Charakteristik für Zahlungen
      const characteristicUUID = '00001013-0000-1000-8000-00805f9b34fb';
      this.characteristic = await service.getCharacteristic(characteristicUUID);

      // Betrag als Byte-Array senden (Format muss an SumUp-Protokoll angepasst werden)
      const amountInCents = Math.round(amount * 100);
      const data = new Uint8Array([
        0x01, // Befehl: Zahlung starten
        (amountInCents >> 8) & 0xFF,
        amountInCents & 0xFF
      ]);

      await this.characteristic.writeValue(data);
      console.log('Zahlungsbefehl gesendet');

      // Auf Antwort warten
      return await this.waitForPaymentResult();
    } catch (error) {
      console.error('Zahlungsfehler:', error);
      throw new Error('Zahlung fehlgeschlagen: ' + error.message);
    }
  }

  // Auf Zahlungsergebnis warten
  async waitForPaymentResult() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Zeitüberschreitung bei Zahlung'));
      }, 120000); // 2 Minuten Timeout

      // Notifications abonnieren
      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const status = value.getUint8(0);

        clearTimeout(timeout);

        if (status === 0x00) {
          resolve({ success: true, message: 'Zahlung erfolgreich' });
        } else {
          reject(new Error('Zahlung abgelehnt'));
        }
      });

      this.characteristic.startNotifications();
    });
  }

  // Verbindung trennen
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
      console.log('Verbindung getrennt');
    }
  }

  // Status prüfen
  isConnected() {
    return this.device && this.device.gatt.connected;
  }

  // Gerätename abrufen
  getDeviceName() {
    return this.device ? this.device.name : null;
  }
}

// Singleton-Instanz exportieren
export const sumupBluetooth = new SumUpBluetooth();