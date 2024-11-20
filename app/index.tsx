import * as React from 'react'
import { View } from 'react-native'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
} from '~/components/ui/card'
import { Text } from '~/components/ui/text'

export default function Screen() {
  return (
    <View className="flex-1 justify-startitems-start gap-5 p-6 bg-secondary/30">
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
              <Text className="text-xl font-semibold">70</Text>
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
