// Package photon deserializes Albion Online's Photon Protocol18 traffic.
// It parses UDP packet payloads into EventData, OperationRequest and
// OperationResponse values and invokes callbacks on a PhotonParser.
//
// Dispatch byte vs real code: EventData.Code is the dispatch byte read from
// the wire (typically 3 for Move, 1 for everything else). The gameplay-level
// Albion event code is carried in Parameters[252] (int16 for generic events,
// or synthesized from Code by PostProcessEvent when absent). Consumers should
// route on Parameters[252], not Code. Same convention for Parameters[253] on
// operations.
package photon
