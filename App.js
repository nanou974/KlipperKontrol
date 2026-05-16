import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

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

const DEFAULT_IP = '192.168.1.74'
const MOONRAKER_PORT = '7125'

const { width, height } =
  Dimensions.get('window')

const scale = Math.min(
  width / 1024,
  height / 600
)

export default function App() {
  // =========================
  // CONNECTION
  // =========================

  const [printerIp, setPrinterIp] =
    useState(DEFAULT_IP)

  const [connected, setConnected] =
    useState(false)

  const [
    connectModalVisible,
    setConnectModalVisible,
  ] = useState(false)

  const [ipInput, setIpInput] =
    useState(DEFAULT_IP)

  // =========================
  // TEMPERATURES
  // =========================

  const [hotend, setHotend] =
    useState('0.0')

  const [bed, setBed] =
    useState('0.0')

  const [
    hotendTarget,
    setHotendTarget,
  ] = useState(0)

  const [
    bedTarget,
    setBedTarget,
  ] = useState(0)

  // =========================
  // PRINT INFO
  // =========================

  const [progress, setProgress] =
    useState(0)

  const [filename, setFilename] =
    useState('No file')

  const [totalTime, setTotalTime] =
    useState('Analyzing print...')

  const [
    remainingTime,
    setRemainingTime,
  ] = useState(
    'Analyzing print...'
  )

  // =========================
  // ETA
  // =========================

  const etaHistory = useRef([])

  const smoothedEta = useRef(null)

  // =========================
  // SPEED / FLOW
  // =========================

  const [speed, setSpeed] =
    useState(100)

  const [flow, setFlow] =
    useState(100)

  // =========================
  // MODALS
  // =========================

  const [modalVisible,
    setModalVisible,
  ] = useState(false)

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

  // =========================
  // AUTO REFRESH
  // =========================

  useEffect(() => {
    fetchPrinterData()

    const interval = setInterval(() => {
      fetchPrinterData()
    }, 1000)

    return () =>
      clearInterval(interval)
  }, [printerIp])

  // =========================
  // FETCH PRINTER DATA
  // =========================

  const fetchPrinterData =
    async () => {
      try {
        const response =
          await fetch(
            `http://${printerIp}:${MOONRAKER_PORT}/printer/objects/query?extruder&heater_bed&virtual_sdcard&print_stats&display_status`
          )

        const json =
          await response.json()

        if (
          !json.result ||
          !json.result.status
        ) {
          setConnected(false)
          return
        }

        setConnected(true)

        const status =
          json.result.status

        // =========================
        // HOTEND
        // =========================

        if (status.extruder) {
          setHotend(
            Number(
              status.extruder
                .temperature || 0
            ).toFixed(1)
          )

          setHotendTarget(
            Number(
              status.extruder
                .target || 0
            ).toFixed(0)
          )
        }

        // =========================
        // BED
        // =========================

        if (status.heater_bed) {
          setBed(
            Number(
              status.heater_bed
                .temperature || 0
            ).toFixed(1)
          )

          setBedTarget(
            Number(
              status.heater_bed
                .target || 0
            ).toFixed(0)
          )
        }

        // =========================
        // PROGRESS
        // =========================

        if (status.display_status) {
          const currentProgress =
            Number(
              status.display_status
                .progress || 0
            )

          setProgress(currentProgress)
        }

        // =========================
        // PRINT STATS + ETA
        // =========================

        if (status.print_stats) {
          const currentFilename =
            status.print_stats
              .filename ||
            'No file'

          setFilename(
            currentFilename
          )

          const printDuration =
            Number(
              status.print_stats
                .total_duration || 0
            )

          const currentProgress =
            Number(
              status.display_status
                ?.progress || 0
            )

          // ETA uniquement
          // après :
          // - 10%
          // - 5 minutes

          if (
            currentProgress >=
              0.10 &&
            printDuration >= 300
          ) {
            const rawEta =
              printDuration /
              currentProgress

            // =========================
            // MOVING AVERAGE
            // =========================

            etaHistory.current.push(
              rawEta
            )

            if (
              etaHistory.current
                .length > 20
            ) {
              etaHistory.current.shift()
            }

            const averageEta =
              etaHistory.current.reduce(
                (a, b) => a + b,
                0
              ) /
              etaHistory.current.length

            // =========================
            // SMOOTHING
            // =========================

            if (
              smoothedEta.current ===
              null
            ) {
              smoothedEta.current =
                averageEta
            } else {
              smoothedEta.current =
                smoothedEta.current *
                  0.92 +
                averageEta * 0.08
            }

            // =========================
            // ANTI SPIKES
            // =========================

            const maxVariation =
              smoothedEta.current *
              0.02

            if (
              averageEta >
              smoothedEta.current +
                maxVariation
            ) {
              smoothedEta.current +=
                maxVariation
            }

            if (
              averageEta <
              smoothedEta.current -
                maxVariation
            ) {
              smoothedEta.current -=
                maxVariation
            }

            // =========================
            // FINAL ETA
            // =========================

            const remainingSeconds =
              smoothedEta.current -
              printDuration

            setTotalTime(
              formatTime(
                smoothedEta.current
              )
            )

            setRemainingTime(
              formatTime(
                Math.max(
                  remainingSeconds,
                  0
                )
              )
            )
          } else {
            setTotalTime(
              'Analyzing print...'
            )

            setRemainingTime(
              'Analyzing print...'
            )
          }
        }
      } catch (err) {
        console.log(
          'FETCH ERROR:',
          err
        )

        setConnected(false)
      }
    }

  // =========================
  // CONNECT
  // =========================

  const connectToPrinter =
    () => {
      setPrinterIp(ipInput)
      setConnectModalVisible(false)
    }

  // =========================
  // SEND GCODE
  // =========================

  const sendGcode = async (
    script
  ) => {
    try {
      await fetch(
        `http://${printerIp}:${MOONRAKER_PORT}/printer/gcode/script`,
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

  // =========================
  // EMERGENCY STOP
  // =========================

  const emergencyStop =
    async () => {
      try {
        await fetch(
          `http://${printerIp}:${MOONRAKER_PORT}/printer/emergency_stop`,
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

  // =========================
  // FORMAT TIME
  // =========================

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

  // =========================
  // SNAP
  // =========================

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

  // =========================
  // SPEED FLOW
  // =========================

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

  // =========================
  // TEMP MODAL
  // =========================

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

  // =========================
  // VALUE MODAL
  // =========================

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
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() =>
            setConnectModalVisible(
              true
            )
          }
        >
          <Text
            style={
              styles.connectButtonText
            }
          >
            {connected
              ? `CONNECTED : ${printerIp}`
              : 'CONNECT PRINTER'}
          </Text>
        </TouchableOpacity>
      </View>

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
          <View style={styles.stopRing}>
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
          </View>
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

      {/* CONNECT MODAL */}
      <Modal
        visible={
          connectModalVisible
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
              Connect Printer
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={ipInput}
              onChangeText={
                setIpInput
              }
              placeholder='192.168.1.xxx'
              placeholderTextColor='#999'
            />

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={
                connectToPrinter
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                CONNECT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      '#2D007A',
    padding: 15 * scale,
  },

  topBar: {
    marginBottom:
      10 * scale,
    alignItems:
      'center',
  },

  connectButton: {
    borderWidth: 2,
    borderColor:
      '#00B7FF',
    paddingHorizontal:
      20 * scale,
    paddingVertical:
      8 * scale,
  },

  connectButtonText: {
    color: 'white',
    fontSize:
      18 * scale,
    fontWeight: 'bold',
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
    alignItems:
      'center',
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

  stopRing: {
    width: 180 * scale,
    height: 180 * scale,
    borderRadius: 200,
    borderWidth: 6,
    borderColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopTopText: {
    color: 'white',
    fontSize:
      28 * scale,
    marginBottom:
      5 * scale,
  },

  stopButton: {
    width: 100 * scale,
    height:
      100 * scale,
    borderRadius: 100,
    backgroundColor:
      '#FF7A1A',
  },

  stopBottomText: {
    color: 'white',
    fontSize:
      28 * scale,
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