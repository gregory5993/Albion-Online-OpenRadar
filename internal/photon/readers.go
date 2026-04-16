package photon

import (
	"bytes"
	"encoding/binary"
	"math"
)

func readCompressedUint32(buf *bytes.Buffer) uint32 {
	var value uint32
	shift := uint(0)
	for {
		b, err := buf.ReadByte()
		if err != nil {
			return 0
		}
		value |= uint32(b&0x7f) << shift
		if b&0x80 == 0 {
			return value
		}
		shift += 7
		if shift >= 35 {
			return 0
		}
	}
}

func readCompressedUint64(buf *bytes.Buffer) uint64 {
	var value uint64
	shift := uint(0)
	for {
		b, err := buf.ReadByte()
		if err != nil {
			return 0
		}
		value |= uint64(b&0x7f) << shift
		if b&0x80 == 0 {
			return value
		}
		shift += 7
		if shift >= 70 {
			return 0
		}
	}
}

func readCompressedInt32(buf *bytes.Buffer) int32 {
	v := readCompressedUint32(buf)
	return int32((v >> 1) ^ uint32(-(int32(v & 1))))
}

func readCompressedInt64(buf *bytes.Buffer) int64 {
	v := readCompressedUint64(buf)
	return int64((v >> 1) ^ uint64(-(int64(v & 1))))
}

func readCount(buf *bytes.Buffer) uint32 {
	return readCompressedUint32(buf)
}

func readInt16(buf *bytes.Buffer) int16 {
	b := buf.Next(2)
	if len(b) < 2 {
		return 0
	}
	return int16(binary.LittleEndian.Uint16(b))
}

func readUint16(buf *bytes.Buffer) uint16 {
	b := buf.Next(2)
	if len(b) < 2 {
		return 0
	}
	return binary.LittleEndian.Uint16(b)
}

func readFloat32(buf *bytes.Buffer) float32 {
	b := buf.Next(4)
	if len(b) < 4 {
		return 0
	}
	return math.Float32frombits(binary.LittleEndian.Uint32(b))
}

func readFloat64(buf *bytes.Buffer) float64 {
	b := buf.Next(8)
	if len(b) < 8 {
		return 0
	}
	return math.Float64frombits(binary.LittleEndian.Uint64(b))
}

func readString(buf *bytes.Buffer) string {
	length := int(readCompressedUint32(buf))
	if length <= 0 || length > buf.Len() {
		return ""
	}
	b := make([]byte, length)
	_, _ = buf.Read(b)
	return string(b)
}
