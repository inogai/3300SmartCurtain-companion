import * as React from 'react'
import { View } from 'react-native'
import RNBluetoothClassic, { BluetoothEventType } from 'react-native-bluetooth-classic'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
} from '~/components/ui/card'

import { Text } from '~/components/ui/text'

export default function Screen() {
  const [device, setDevice] = React.useState(null)

  async function loadPairedDevices() {
    try {
      console.log('Loading paired devices')
      console.log(RNBluetoothClassic)
      const paired = await RNBluetoothClassic.getBondedDevices()
      console.log('Paired devices:', paired)
    }
    catch (err) {
    // Error if Bluetooth is not enabled
    // Or there are any issues requesting paired devices
      console.error(err)
    }
  }

  return (
    <View className="flex-1 justify-startitems-start gap-5 p-6 bg-secondary/30">
      <Card className="w-full p-6 rounded-2xl">
        <CardContent>
          <Button onPress={loadPairedDevices}>
            <Text>
              Load Paired Devices
            </Text>
          </Button>
        </CardContent>

      </Card>
      <Card className="w-full p-6 rounded-2xl">
        <CardContent>
          <View className="flex-row justify-around gap-3">
            <View className="items-center">
              <Button>
                <Text className="text-2xl font-semibold">Open</Text>
              </Button>
            </View>
            <View className="items-center">
              <Text className="text-sm text-muted-foreground">Currently</Text>
              <Text className="text-xl font-semibold">
                {device || 'None'}
              </Text>
            </View>
            <View className="items-center">
              <Button>
                <Text className="text-2xl font-semibold">Close</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
