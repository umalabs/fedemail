// @generated by protobuf-ts 2.7.0
// @generated from protobuf file "proto/people/v1/people.proto" (package "people.v1", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { People } from "./people";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ListConnectionsResponse } from "./people";
import type { Empty } from "../../../google/protobuf/empty";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service people.v1.People
 */
export interface IPeopleClient {
    /**
     * @generated from protobuf rpc: ConnectionsList(google.protobuf.Empty) returns (people.v1.ListConnectionsResponse);
     */
    connectionsList(input: Empty, options?: RpcOptions): UnaryCall<Empty, ListConnectionsResponse>;
}
/**
 * @generated from protobuf service people.v1.People
 */
export class PeopleClient implements IPeopleClient, ServiceInfo {
    typeName = People.typeName;
    methods = People.methods;
    options = People.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: ConnectionsList(google.protobuf.Empty) returns (people.v1.ListConnectionsResponse);
     */
    connectionsList(input: Empty, options?: RpcOptions): UnaryCall<Empty, ListConnectionsResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<Empty, ListConnectionsResponse>("unary", this._transport, method, opt, input);
    }
}
