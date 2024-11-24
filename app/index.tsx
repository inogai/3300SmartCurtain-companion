import type { BluetoothDevice, BluetoothEventSubscription } from 'react-native-bluetooth-classic'
import Slider from '@react-native-community/slider'
import * as React from 'react'
import { Platform, View } from 'react-native'
import RNBluetoothClassic, { BluetoothEventType } from 'react-native-bluetooth-classic'
import { Button } from '~/components/ui/button'

import {
  Card,
  CardContent,
  CardHeader,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
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

  async function doRead() {
    console.log('Reading data')
    const message = await this.props.device.read()
    console.log('Message:', message)
  }

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
    }
    catch (error) {
    // Handle error accordingly
    }
  }

  async function disconnect() {
    if (device) {
      const conn = await device.disconnect()
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
    })
    setReadSubscription(subscription)
  }

  function removeReadSubscription() {
    if (readSubscription) {
      readSubscription.remove()
      setReadSubscription(null)
    }
  }

  const [lightThreasholdInputValue, setLightThreasholdInputValue] = React.useState<number>(1500)

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
        <Button onPress={updateLedState}>
          <Text> Query State </Text>
        </Button>
        <Button onPress={doRead}>
          <Text> Read </Text>

        </Button>
        <Text>
          Connected:
          {connection ? 'Yes' : 'No'}
        </Text>
      </Row>

      <Row>
        <Button onPress={connect}>
          <Text> Connect </Text>
        </Button>
        <Button onPress={disconnect}>
          <Text> Disconnect </Text>
        </Button>
        <Text>
          Available:
          {}
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
          <Text>
            Higher Thresold
          </Text>
          <View className="flex-row justify-between">
            <View className="grow">
              <Slider
                minimumValue={0}
                maximumValue={5000}
                value={lightThreasholdInputValue}
                onValueChange={setLightThreasholdInputValue}
                step={1}
              />
            </View>
            <Text className="w-[40px]">{lightThreasholdInputValue}</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
