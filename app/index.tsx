import type { BluetoothDevice } from 'react-native-bluetooth-classic'
import Slider from '@react-native-community/slider'
import * as React from 'react'
import { View } from 'react-native'
import RNBluetoothClassic, { BluetoothEventType } from 'react-native-bluetooth-classic'
import { Button } from '~/components/ui/button'

import {
  Card,
  CardContent,
  CardHeader,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Text } from '~/components/ui/text'

// const deviceName = 'GROUP28 SMART CURTAIN'
const deviceName = 'inogai-mba'

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
}> = ({ ...props }) => {
  return (
    <Button
      disabled={!props.device}
      onPress={() => props.device?.write(props.cmd)}
    >
      <Text className="text-2xl font-semibold">{props.label}</Text>
    </Button>
  )
}

export default function Screen() {
  const [device, setDevice] = React.useState<BluetoothDevice | null>(null)
  const [connection, setConnection] = React.useState<boolean>(false)
  let readSubscription: any = null

  async function selectPairedDevices() {
    try {
      const pairedDevices = await RNBluetoothClassic.getBondedDevices()

      for (const device of pairedDevices) {
        if (device.name === deviceName) {
          setDevice(device)
          console.log('Device found', device)
          return
        }
      }

      throw new Error('Device not found')
    }
    catch (err) {
    // Error if Bluetooth is not enabled
    // Or there are any issues requesting paired devices
      console.error(err)
    }
  }

  async function connect() {
    if (!device) {
      console.error('No device selected.')
      return
    }
    try {
      let connection = await device.isConnected()
      console.error('Already connected')
      if (!connection) {
        connection = await device.connect()
      }

      setConnection(connection)
      initializeRead()
    }
    catch (error) {
    // Handle error accordingly
    }
  }

  function initializeRead() {
    if (!device) {
      console.error('No device selected.')
      return
    }
    readSubscription = device.onDataReceived(data => onReceivedData(data))
  }

  async function onReceivedData(data: string) {
    console.log('Received data:', data)
  }

  function send(data: string) {
    if (!device) {
      console.error('No device selected.')
      return
    }
    device.write(data, 'hex')
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
        <Button onPress={connect}>
          <Text> Connect </Text>
        </Button>
        <Text>
          Connected:
          {connection ? 'Yes' : 'No'}
        </Text>
        <Button onPress={initializeRead}>
          <Text> initializeRead </Text>
        </Button>
      </Row>

      <Row>
        <View className="items-center">
          <CmdButton device={device} cmd="01" label="Open" />
        </View>
        <View className="items-center">
          <Text className="text-sm text-muted-foreground">Currently</Text>
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
