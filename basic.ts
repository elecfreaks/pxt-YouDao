/**
* Functions to PlanetX sensor by ELECFREAKS Co.,Ltd.
*/
//% color=#00B1ED  icon="\uf005" block="PlanetX_Base" blockId="PlanetX_Base"
//% groups='["Digital", "Analog", "IIC Port"]'
namespace PlanetX_Basic {
    ///////////////////////////////////////////////////////RJpin_to_pin
    function RJpin_to_analog(Rjpin: AnalogRJPin): any {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case AnalogRJPin.J1:
                pin = AnalogPin.P1
                break;
            case AnalogRJPin.J2:
                pin = AnalogPin.P2
                break;
        }
        return pin
    }
    function RJpin_to_digital(Rjpin: DigitalRJPin): any {
        let pin = DigitalPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pin = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pin = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pin = DigitalPin.P16
                break;
        }
        return pin
    }

    ///////////////////////////////enum
    export enum DigitalRJPin {
        //% block="J1" 
        J1,
        //% block="J2"
        J2,
        //% block="J3"
        J3,
        //% block="J4"
        J4
    }
    export enum AnalogRJPin {
        //% block="J1"
        J1,
        //% block="J2"
        J2
    }

    export enum Distance_Unit_List {
        //% block="cm" 
        Distance_Unit_cm,

        //% block="inch"
        Distance_Unit_inch,
    }

    export enum DHT11_state {
        //% block="temperature(℃)" enumval=0
        DHT11_temperature_C,

        //% block="humidity(0~100)" enumval=1
        DHT11_humidity,
    }

    ///////////////////////////////////blocks/////////////////////////////

    /**
* get Ultrasonic distance
*/
    //% blockId=sonarbit block="Ultrasonic sensor %Rjpin distance %distance_unit"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% distance_unit.fieldEditor="gridpicker"
    //% distance_unit.fieldOptions.columns=2
    //% subcategory=Sensor group="Digital" color=#EA5532
    export function ultrasoundSensor(Rjpin: DigitalRJPin, distance_unit: Distance_Unit_List): number {
        let pinT = DigitalPin.P1
        let pinE = DigitalPin.P2
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pinT = DigitalPin.P1
                pinE = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pinT = DigitalPin.P2
                pinE = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pinT = DigitalPin.P13
                pinE = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pinT = DigitalPin.P15
                pinE = DigitalPin.P16
                break;
        }
        pins.setPull(pinT, PinPullMode.PullNone)
        pins.digitalWritePin(pinT, 0)
        control.waitMicros(2)
        pins.digitalWritePin(pinT, 1)
        control.waitMicros(10)
        pins.digitalWritePin(pinT, 0)

        // read pulse
        let d = pins.pulseIn(pinE, PulseValue.High, 25000)
        let distance = d * 9 / 6 / 58

        if (distance > 400) {
            distance = 0
        }
        switch (distance_unit) {
            case Distance_Unit_List.Distance_Unit_cm:
                return Math.floor(distance)  //cm
                break
            case Distance_Unit_List.Distance_Unit_inch:
                return Math.floor(distance / 30.48)   //inch
                break
            default:
                return 0
        }
    }
    /**
    * get dht11 temperature and humidity Value
    * @param dht11pin describe parameter here, eg: DigitalPin.P15     
    */
    //% blockId="readdht11" block="DHT11 sensor %Rjpin %dht11state value"
    //% Rjpin.fieldEditor="gridpicker" dht11state.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2 dht11state.fieldOptions.columns=1
    //% subcategory=Sensor group="Digital" color=#EA5532
    export function dht11Sensor(Rjpin: DigitalRJPin, dht11state: DHT11_state): number {

        //initialize
        let _temperature: number = -999.0
        let _humidity: number = -999.0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        let pin = DigitalPin.P1
        pin = RJpin_to_digital(Rjpin)
        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)

        pins.setPull(pin, PinPullMode.PullUp)
        pins.digitalWritePin(pin, 0) //begin protocol, pull down pin
        basic.pause(18)
        pins.digitalReadPin(pin) //pull up pin
        control.waitMicros(40)
        while (pins.digitalReadPin(pin) == 0); //sensor response
        while (pins.digitalReadPin(pin) == 1); //sensor response

        //read data (5 bytes)
        for (let index = 0; index < 40; index++) {
            while (pins.digitalReadPin(pin) == 1);
            while (pins.digitalReadPin(pin) == 0);
            control.waitMicros(28)
            //if sensor still pull up data pin after 28 us it means 1, otherwise 0
            if (pins.digitalReadPin(pin) == 1) dataArray[index] = true
        }
        //convert byte number array to integer
        for (let index = 0; index < 5; index++)
            for (let index2 = 0; index2 < 8; index2++)
                if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)
        //verify checksum
        checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
        checksum = resultArray[4]
        if (checksumTmp >= 512) checksumTmp -= 512
        if (checksumTmp >= 256) checksumTmp -= 256
        switch (dht11state) {
            case DHT11_state.DHT11_temperature_C:
                _temperature = resultArray[2] + resultArray[3] / 100
                return _temperature
            case DHT11_state.DHT11_humidity:
                _humidity = resultArray[0] + resultArray[1] / 100
                return _humidity
        }
        return 0
    }

    //% blockId="potentiometer" block="Trimpot %Rjpin analog value"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Input color=#E2C438 group="Analog"
    export function trimpot(Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        return pins.analogReadPin(pin)
    }

    /**
    * toggle fans
    */
    //% blockId=fans block="Motor fan %Rjpin toggle to $fanstate || speed %speed \\%"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% fanstate.shadow="toggleOnOff"
    //% subcategory=Excute group="Digital" color=#EA5532
    //% speed.min=0 speed.max=100
    //% expandableArgumentMode="toggle"
    export function motorFan(Rjpin: DigitalRJPin, fanstate: boolean, speed: number = 100): void {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = AnalogPin.P1
                break;
            case DigitalRJPin.J2:
                pin = AnalogPin.P2
                break;
            case DigitalRJPin.J3:
                pin = AnalogPin.P13
                break;
            case DigitalRJPin.J4:
                pin = AnalogPin.P15
                break;
        }
        if (fanstate) {
            pins.analogSetPeriod(pin, 100)
            pins.analogWritePin(pin, Math.map(speed, 0, 100, 0, 1023))
        }
        else {
            pins.analogWritePin(pin, 0)
            speed = 0
        }
    }
}