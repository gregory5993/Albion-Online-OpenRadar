package photon

import "strconv"

// ByteArray serializes as {"type":"Buffer","data":[...]} because the web
// front-end parses byte arrays assuming the Node.js Buffer shape.
type ByteArray []byte

func (b ByteArray) MarshalJSON() ([]byte, error) {
	const prefix = `{"type":"Buffer","data":[`
	const suffix = `]}`
	out := make([]byte, 0, len(prefix)+len(suffix)+4*len(b))
	out = append(out, prefix...)
	for i, v := range b {
		if i > 0 {
			out = append(out, ',')
		}
		out = strconv.AppendUint(out, uint64(v), 10)
	}
	out = append(out, suffix...)
	return out, nil
}

type EventData struct {
	Code       byte
	Parameters map[byte]interface{}
}

type OperationRequest struct {
	OperationCode byte
	Parameters    map[byte]interface{}
}

type OperationResponse struct {
	OperationCode byte
	ReturnCode    int16
	DebugMessage  string
	Parameters    map[byte]interface{}
}
