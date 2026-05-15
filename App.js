import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
} from 'react-native'

import Slider from '@react-native-community/slider'

import * as Haptics from 'expo-haptics'

const MOONRAKER_IP = '192.168.1.74'
const MOONRAKER_PORT = '7125'

const { width, height } = Dimensions.get('window')
const scale = Math.min(width / 1024, height / 600)

export default function App() {
  const [hotend, setHotend] = useState('0.0')
  const [bed, setBed] = useState('0.0')

  const [hotendTarget, setHotendTarget] =
    useState(0)

  const [bedTarget, setBedTarget] =
    useState(0)

  const [progress, setProgress] = useState(0)

  const [filename, setFilename] =
    useState('No file')

  const [totalTime, setTotalTime] =
    useState('0h0m0s')

  const [remainingTime, setRemainingTime] =
    useState('0h0m0s')

  const [speed, setSpeed] = useState(100)
  const [flow, setFlow] = useState(100)

  const [modalVisible, setModalVisible] =
    useState(false)

  const [tempType, setTempType] =
    useState('hotend')

  const [tempInput, setTempInput] =
    useState('')

  const [
    valueModalVisible,
    setValueModalVisible,
  ] = useState(false)

  const [valueType, setValueType] =
    useState('speed')

  const [valueInput, setValueInput] =
    useState('100')

  useEffect(() => {
    fetchPrinterData()

    const interval = setInterval(() => {
      fetchPrinterData()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchPrinterData = async () => {
    try {
      const response = await fetch(
        `http://${MOONRAKER_IP}:${MOONRAKER_PORT}/printer/objects/query?extruder&heater_bed&virtual_sdcard&print_stats&display_status`
      )

      const json = await response.json()

      console.log(
        'PRINTER DATA:',
        json
      )

      if (
        !json.result ||
        !json.result.status
      ) {
        return
      }

      const status = json.result.status

      // HOTEND
      if (status.extruder) {
        setHotend(
          Number(
            status.extruder.temperature || 0
          ).toFixed(1)
        )

        setHotendTarget(
          Number(
            status.extruder.target || 0
          ).toFixed(0)
        )
      }

      // BED
      if (status.heater_bed) {
        setBed(
          Number(
            status.heater_bed.temperature || 0
          ).toFixed(1)
        )

        setBedTarget(
          Number(
            status.heater_bed.target || 0
          ).toFixed(0)
        )
      }

      // PROGRESSION
      if (status.display_status) {
        console.log(
          'DISPLAY STATUS:',
          status.display_status
        )

        const currentProgress =
          Number(
            status.display_status
              .progress || 0
          )

        setProgress(currentProgress)

        // ETA dynamique
        const printed =
          status.print_stats
            ?.print_duration || 0

        if (currentProgress > 0) {
          const estimatedTotal =
            printed / currentProgress

          const remaining =
            estimatedTotal - printed

          setTotalTime(
            formatTime(
              estimatedTotal
            )
          )

          setRemainingTime(
            formatTime(
              Math.max(
                remaining,
                0
              )
            )
          )
        }
      }

      // PRINT STATS
      if (status.print_stats) {
        console.log(
          'PRINT STATS:',
          status.print_stats
        )

        const currentFilename =
          status.print_stats.filename ||
          'No file'

        setFilename(currentFilename)
      }
    } catch (err) {
      console.log(
        'FETCH ERROR:',
        err
      )
    }
  }

  const sendGcode = async (
    script
  ) => {
    try {
      await fetch(
        `http://${MOONRAKER_IP}:${MOONRAKER_PORT}/printer/gcode/script`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            script,
          }),
        }
      )
    } catch (err) {
      console.log(err)
    }
  }

  const emergencyStop =
    async () => {
      try {
        await fetch(
          `http://${MOONRAKER_IP}:${MOONRAKER_PORT}/printer/emergency_stop`,
          {
            method: 'POST',
          }
        )

        Haptics.notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Error
        )
      } catch (err) {
        console.log(err)
      }
    }

  const confirmEmergencyStop =
    () => {
      Alert.alert(
        'Emergency Stop',
        'Are you sure you want to stop the printer?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'STOP',
            style:
              'destructive',
            onPress:
              emergencyStop,
          },
        ]
      )
    }

  const formatTime = (
    seconds
  ) => {
    const h = Math.floor(
      seconds / 3600
    )

    const m = Math.floor(
      (seconds % 3600) / 60
    )

    const s = Math.floor(
      seconds % 60
    )

    return `${h}h${m}m${s}s`
  }

  const magneticSnap = (
    value
  ) => {
    if (
      value >= 97 &&
      value <= 103
    ) {
      Haptics.selectionAsync()
      return 100
    }

    return Math.round(value)
  }

  const updateSpeed = (
    value
  ) => {
    setSpeed(
      magneticSnap(value)
    )
  }

  const updateFlow = (
    value
  ) => {
    setFlow(
      magneticSnap(value)
    )
  }

  const applySpeed = () => {
    sendGcode(
      `M220 S${speed}`
    )
  }

  const applyFlow = () => {
    sendGcode(
      `M221 S${flow}`
    )
  }

  const resetSpeed = () => {
    setSpeed(100)

    sendGcode('M220 S100')
  }

  const resetFlow = () => {
    setFlow(100)

    sendGcode('M221 S100')
  }

  const openTempModal = (
    type
  ) => {
    setTempType(type)

    if (type === 'hotend') {
      setTempInput(
        String(hotendTarget)
      )
    } else {
      setTempInput(
        String(bedTarget)
      )
    }

    setModalVisible(true)
  }

  const applyTemperature =
    () => {
      const temp = Number(
        tempInput
      )

      if (
        tempType === 'hotend'
      ) {
        sendGcode(
          `M104 S${temp}`
        )
      } else {
        sendGcode(
          `M140 S${temp}`
        )
      }

      setModalVisible(false)
    }

  const openValueModal = (
    type
  ) => {
    setValueType(type)

    if (type === 'speed') {
      setValueInput(
        String(speed)
      )
    } else {
      setValueInput(
        String(flow)
      )
    }

    setValueModalVisible(true)
  }

  const applyValue = () => {
    const value = Number(
      valueInput
    )

    if (
      valueType === 'speed'
    ) {
      setSpeed(value)

      sendGcode(
        `M220 S${value}`
      )
    } else {
      setFlow(value)

      sendGcode(
        `M221 S${value}`
      )
    }

    setValueModalVisible(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* TEMP */}
        <View style={styles.tempBox}>
          <Text
            style={styles.tempTitle}
          >
            TEMP
          </Text>

          <TouchableOpacity
            style={
              styles.tempButton
            }
            onPress={() =>
              openTempModal(
                'hotend'
              )
            }
          >
            <Text
              style={
                styles.tempText
              }
            >
              Hotend : {hotend}
              °C
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.tempButton
            }
            onPress={() =>
              openTempModal(
                'bed'
              )
            }
          >
            <Text
              style={
                styles.tempText
              }
            >
              Bed : {bed}°C
            </Text>
          </TouchableOpacity>
        </View>

        {/* SLIDERS */}
        <View
          style={
            styles.sliderContainer
          }
        >
          {/* SPEED */}
          <View
            style={
              styles.controlHeader
            }
          >
            <Text
              style={
                styles.sliderLabel
              }
            >
              Speed :
            </Text>

            <TouchableOpacity
              style={
                styles.resetMiniButton
              }
              onPress={
                resetSpeed
              }
            >
              <Text
                style={
                  styles.resetMiniText
                }
              >
                ↺
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.valueBox
              }
              onPress={() =>
                openValueModal(
                  'speed'
                )
              }
            >
              <Text
                style={
                  styles.valueText
                }
              >
                {speed} %
              </Text>
            </TouchableOpacity>
          </View>

          <Slider
            style={
              styles.slider
            }
            minimumValue={25}
            maximumValue={300}
            value={speed}
            minimumTrackTintColor='#00B7FF'
            maximumTrackTintColor='#555'
            thumbTintColor='#00B7FF'
            onValueChange={
              updateSpeed
            }
            onSlidingComplete={
              applySpeed
            }
          />

          {/* FLOW */}
          <View
            style={
              styles.controlHeader
            }
          >
            <Text
              style={
                styles.sliderLabel
              }
            >
              Flow :
            </Text>

            <TouchableOpacity
              style={
                styles.resetMiniButton
              }
              onPress={
                resetFlow
              }
            >
              <Text
                style={
                  styles.resetMiniText
                }
              >
                ↺
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.valueBox
              }
              onPress={() =>
                openValueModal(
                  'flow'
                )
              }
            >
              <Text
                style={
                  styles.valueText
                }
              >
                {flow} %
              </Text>
            </TouchableOpacity>
          </View>

          <Slider
            style={
              styles.slider
            }
            minimumValue={50}
            maximumValue={150}
            value={flow}
            minimumTrackTintColor='#00B7FF'
            maximumTrackTintColor='#555'
            thumbTintColor='#00B7FF'
            onValueChange={
              updateFlow
            }
            onSlidingComplete={
              applyFlow
            }
          />
        </View>

        {/* STOP */}
        <TouchableOpacity
          style={
            styles.stopContainer
          }
          onPress={
            confirmEmergencyStop
          }
        >
          <Text
            style={
              styles.stopTopText
            }
          >
            EMERGENCY
          </Text>

          <View
            style={
              styles.stopButton
            }
          />

          <Text
            style={
              styles.stopBottomText
            }
          >
            STOP
          </Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM */}
      <View
        style={
          styles.bottomContainer
        }
      >
        <View
          style={
            styles.progressBarBackground
          }
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${
                  progress * 100
                }%`,
              },
            ]}
          />

          <Text
            style={
              styles.totalTimeText
            }
          >
            {totalTime}
          </Text>

          <Text
            style={
              styles.progressText
            }
          >
            {Math.round(
              progress * 100
            )}
            %
          </Text>
        </View>

        <Text
          style={
            styles.filename
          }
          numberOfLines={1}
        >
          {filename}
        </Text>

        <Text
          style={
            styles.remainingTime
          }
        >
          {remainingTime}
        </Text>
      </View>

      {/* TEMP MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType='fade'
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Set {tempType}{' '}
              temperature
            </Text>

            <TextInput
              style={
                styles.input
              }
              keyboardType='numeric'
              value={tempInput}
              onChangeText={
                setTempInput
              }
            />

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={
                applyTemperature
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                APPLY
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VALUE MODAL */}
      <Modal
        visible={
          valueModalVisible
        }
        transparent
        animationType='fade'
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Set {valueType}
            </Text>

            <TextInput
              style={
                styles.input
              }
              keyboardType='numeric'
              value={valueInput}
              onChangeText={
                setValueInput
              }
            />

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={
                applyValue
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                APPLY
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#2D007A',
      padding: 15 * scale,
    },

    topRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },

    tempBox: {
      width: '30%',
      borderWidth: 2,
      borderColor:
        '#00B7FF',
      padding: 12 * scale,
    },

    tempTitle: {
      color: 'white',
      fontSize:
        22 * scale,
      fontWeight: 'bold',
      alignSelf: 'center',
      marginBottom:
        10 * scale,
    },

    tempButton: {
      borderWidth: 2,
      borderColor:
        '#00B7FF',
      padding: 12 * scale,
      marginBottom:
        12 * scale,
    },

    tempText: {
      color: 'white',
      fontSize:
        26 * scale,
      fontWeight: 'bold',
    },

    sliderContainer: {
      width: '42%',
      justifyContent:
        'center',
    },

    controlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom:
        5 * scale,
    },

    sliderLabel: {
      color: 'white',
      fontSize:
        28 * scale,
      fontWeight: 'bold',
      marginRight:
        10 * scale,
    },

    resetMiniButton: {
      marginRight:
        10 * scale,
    },

    resetMiniText: {
      color: 'white',
      fontSize:
        26 * scale,
    },

    valueBox: {
      borderWidth: 1,
      borderColor:
        '#AEEBFF',
      paddingHorizontal:
        18 * scale,
      paddingVertical:
        6 * scale,
    },

    valueText: {
      color: 'white',
      fontSize:
        24 * scale,
    },

    slider: {
      width: '100%',
      height: 30 * scale,
      marginBottom:
        20 * scale,
    },

    stopContainer: {
      width: '22%',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    stopTopText: {
      color: 'white',
      fontSize:
        34 * scale,
      marginBottom:
        5 * scale,
    },

    stopButton: {
      width: 110 * scale,
      height:
        110 * scale,
      borderRadius: 100,
      backgroundColor:
        '#FF7A1A',
    },

    stopBottomText: {
      color: 'white',
      fontSize:
        34 * scale,
      marginTop:
        5 * scale,
    },

    bottomContainer: {
      marginTop:
        15 * scale,
      alignItems:
        'center',
    },

    progressBarBackground:
      {
        width: '96%',
        height:
          38 * scale,
        backgroundColor:
          '#E0E0E0',
        overflow:
          'hidden',
        justifyContent:
          'center',
      },

    progressBarFill: {
      position:
        'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor:
        '#FFC400',
    },

    totalTimeText: {
      position:
        'absolute',
      left: 10 * scale,
      color: '#2D007A',
      fontSize:
        18 * scale,
      fontWeight: 'bold',
    },

    progressText: {
      position:
        'absolute',
      alignSelf:
        'center',
      color: '#2D007A',
      fontSize:
        20 * scale,
      fontWeight: 'bold',
    },

    filename: {
      marginTop:
        12 * scale,
      color: 'white',
      fontSize:
        28 * scale,
      fontWeight: 'bold',
    },

    remainingTime: {
      marginTop:
        5 * scale,
      color: 'white',
      fontSize:
        22 * scale,
    },

    modalOverlay: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        'rgba(0,0,0,0.7)',
    },

    modalContent: {
      width: 300 * scale,
      backgroundColor:
        '#2D007A',
      padding:
        20 * scale,
      borderWidth: 2,
      borderColor:
        '#00B7FF',
    },

    modalTitle: {
      color: 'white',
      fontSize:
        24 * scale,
      textAlign:
        'center',
      marginBottom:
        15 * scale,
    },

    input: {
      borderWidth: 2,
      borderColor:
        '#00B7FF',
      color: 'white',
      fontSize:
        26 * scale,
      padding:
        10 * scale,
      marginBottom:
        15 * scale,
      textAlign:
        'center',
    },

    modalButton: {
      backgroundColor:
        '#00B7FF',
      padding:
        14 * scale,
    },

    modalButtonText: {
      color: 'white',
      fontSize:
        22 * scale,
      fontWeight: 'bold',
      textAlign:
        'center',
    },
  })