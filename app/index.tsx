import type { BluetoothDevice, BluetoothEventSubscription } from 'react-native-bluetooth-classic'
import Slider from '@react-native-community/slider'
import * as React from 'react'
import { Platform, View } from 'react-native'
import RNBluetoothClassic, { BluetoothEventType } from 'react-native-bluetooth-classic'
import { Button } from '~/components/ui/button'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '~/components/ui/card'
import { Text } from '~/components/ui/text'

const deviceName = 'GROUP28 SMART CURTAIN'
// const deviceName = 'inogai-mba'

type FC = React.FC<{ children: React.ReactNode }>

const Row: FC = ({ children }) => {
  return (
    <Card className="w-full rounded-2xl">
      <CardContent className="pt-6">
        <View className="flex-row justify-around gap-3">
          {children}
        </View>
      </CardContent>
    </Card>
  )
}

const Column: FC = ({ children }) => {
  return (
    <Card className="w-full rounded-2xl">
      <CardContent className="pt-6">
        <View className="flex-col justify-around gap-3">
          {children}
        </View>
      </CardContent>
    </Card>
  )
}

const CmdButton: React.FC<{
  device: BluetoothDevice | null
  cmd: string
  label: string
  encoding?: 'utf8' | 'hex'
}> = ({ ...props }) => {
  return (
    <Button
      disabled={!props.device}
      onPress={() => props.device?.write(props.cmd, props.encoding ?? 'hex')}
    >
      <Text className="text-2xl font-semibold">{props.label}</Text>
    </Button>
  )
}

export default function Screen() {
  const [device, setDevice] = React.useState<BluetoothDevice | null>(null)
  const [connection, setConnection] = React.useState<boolean>(false)

  async function selectPairedDevices() {
    const pairedDevices = await RNBluetoothClassic.getBondedDevices()

    for (const device of pairedDevices) {
      if (device.name === deviceName) {
        setDevice(device)
        console.log('Device found', device)
        return device
      }
    }

    throw new Error('Device not found')
  }

  async function connect() {
    console.log('Connecting')
    if (!device) {
      await selectPairedDevices()
      console.error('Device not found')
      return
    }
    try {
      let connection = await device.isConnected()
      if (!connection) {
        connection = await device.connect()
        console.log('Connected')
      }
      else {
        console.log('Already connected')
      }

      setConnection(connection)
      initailizeRead()

      updateLedState()
      loadThresholds()
    }
    catch (error) {
    // Handle error accordingly
    }
  }

  async function disconnect() {
    if (device) {
      await device.disconnect()
      removeReadSubscription()
    }
  }

  function waitForData(timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!device) {
        reject(new Error('Device not found'))
      }

      let timeoutId: NodeJS.Timeout | null = null

      const subscription = device!.onDataReceived((msg) => {
        subscription.remove()
        resolve(msg.data)

        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })

      timeoutId = setTimeout(() => {
        if (subscription) {
          subscription.remove()
        }
      }, timeout)
    })
  }

  const [ledState, setLedState] = React.useState<number>(0)

  async function updateLedState() {
    if (device) {
      const promise = waitForData(1000)
      device.write('11', 'hex')
      const data = await promise

      const val = Number.parseInt(data.split('led_state=')[1], 10)
      setLedState(val)
    }
  }

  const [readSubscription, setReadSubscription] = React.useState<BluetoothEventSubscription | null>(null)
  const [lightIntensity, setLightIntensity] = React.useState<number>(0)

  let pollLiInterval: NodeJS.Timeout | null = null

  function pollLightIntensity() {
    if (pollLiInterval) {
      clearInterval(pollLiInterval)
    }

    pollLiInterval = setInterval(async () => {
      if (device) {
        device.write('12', 'hex')
      }
    }, 5000)
  }

  pollLightIntensity()

  const [lightThresoldUpper, setLightThresholdUpper] = React.useState<number>(2000)
  const [lightThresoldLower, setLightThresholdLower] = React.useState<number>(500)

  function initailizeRead() {
    if (!device) {
      console.error('Device not found')
      return
    }
    if (readSubscription) {
      console.warn('Subscription already exists, removing it.')
      readSubscription.remove()
    }
    const subscription = device.onDataReceived((msg) => {
      console.log('Data received:', msg.data)

      if (msg.data.includes('led_state=')) {
        const val = Number.parseInt(msg.data.split('led_state=')[1], 10)
        setLedState(val)
      }

      if (msg.data.includes('adc_value=')) {
        const val = Number.parseInt(msg.data.split('adc_value=')[1], 10)
        setLightIntensity(val)
      }

      if (msg.data.includes('light_thresold_upper=')) {
        const val = Number.parseInt(msg.data.split('light_thresold_upper=')[1], 10)
        setLightThresholdUpper(val)
      }

      if (msg.data.includes('light_thresold_lower=')) {
        const val = Number.parseInt(msg.data.split('light_thresold_lower=')[1], 10)
        setLightThresholdLower(val)
      }
    })
    setReadSubscription(subscription)
  }

  function removeReadSubscription() {
    if (readSubscription) {
      readSubscription.remove()
      setReadSubscription(null)
    }
  }

  function loadThresholds() {
    if (device) {
      device.write('13', 'hex')
      device.write('14', 'hex')
    }
  }

  function toHex(val: number, bytes: number): string {
    const str = val.toString(16)

    if (str.length < bytes * 2) {
      return str.padStart(bytes * 2, '0')
    }
    else if (str.length > bytes * 2) {
      return str.slice(0, bytes * 2)
    }

    return str
  }

  function applyThresholds() {
    if (device) {
      device.write('21', 'hex')
      device.write(toHex(lightThresoldUpper, 2), 'hex')
      device.write('22', 'hex')
      device.write(toHex(lightThresoldLower, 2), 'hex')
    }
  }

  return (
    <View className="flex-1 justify-startitems-start gap-5 p-6 bg-secondary/30">
      <Card className="w-full p-6 rounded-2xl">
        <CardContent>
          <Button onPress={selectPairedDevices}>
            <Text>
              Load Paired Devices
            </Text>
          </Button>
          <View>
            {
              device === null
                ? (
                    <Text>
                      No device found
                    </Text>
                  )
                : (
                    <Text>
                      {
                        `Device found:
Name: ${device.name} 
Address: ${device.address}`
                      }
                    </Text>
                  )
            }

          </View>
        </CardContent>

      </Card>

      <Row>
        <Button onPress={connect}>
          <Text> Connect </Text>
        </Button>
        <Button onPress={disconnect}>
          <Text> Disconnect </Text>
        </Button>
        <Text>
          Connected:
          {connection ? 'Yes' : 'No'}
        </Text>
      </Row>

      <Row>
        <View className="items-center">
          <CmdButton device={device} cmd="01" label="Open" />
        </View>
        <View className="items-center">
          <Text className="text-sm text-muted-foreground">Currently</Text>
          <Text className="text-2xl font-semibold">{ledState}</Text>
        </View>
        <View className="items-center">
          <CmdButton device={device} cmd="02" label="Close" />
        </View>
      </Row>

      <Card>
        <CardHeader>
          <Text className="text-xl font-semibold">Light Intensity Thresold</Text>
        </CardHeader>
        <CardContent>
          <View className="flex-row justify-between">
            <Text>Current Value</Text>
            <Text>{lightIntensity}</Text>
          </View>

          <Text>
            Higher Thresold
          </Text>
          <View className="flex-row justify-between">
            <View className="grow">
              <Slider
                minimumValue={0}
                maximumValue={5000}
                value={lightThresoldUpper}
                onValueChange={setLightThresholdUpper}
                step={1}
              />
            </View>
            <Text className="w-[40px]">{lightThresoldUpper}</Text>
          </View>

          <Text>
            Lower Thresold
          </Text>
          <View className="flex-row justify-between">
            <View className="grow">
              <Slider
                minimumValue={0}
                maximumValue={5000}
                value={lightThresoldLower}
                onValueChange={setLightThresholdLower}
                step={1}
              />
            </View>
            <Text className="w-[40px]">{lightThresoldLower}</Text>
          </View>
        </CardContent>
        <CardFooter>
          <View className="flex-row justify-between gap-6">
            <Button onPress={loadThresholds}>
              <Text>Cancel</Text>
            </Button>

            <Button onPress={applyThresholds}>
              <Text>Apply</Text>
            </Button>
          </View>
        </CardFooter>
      </Card>
    </View>
  )
}
