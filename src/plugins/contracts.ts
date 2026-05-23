export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type PluginCapability =
  | "panel"
  | "overlay"
  | "interactable"
  | "room-event"
  | "http-route";

export interface PluginInteractableManifest {
  actionId: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface PluginRouteManifest {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  description?: string;
}

export interface PluginEventManifest {
  type: string;
  description?: string;
}

export interface PluginManifest {
  id: string;
  version: string;
  displayName: string;
  capabilities: PluginCapability[];
  defaultConfig: JsonObject;
  interactables: PluginInteractableManifest[];
  routes?: PluginRouteManifest[];
  events?: PluginEventManifest[];
}

export interface RoomPluginConfig {
  pluginId: string;
  enabled: boolean;
  config: JsonObject;
  manifest: PluginManifest;
}

export interface PluginActionRequest {
  pluginId: string;
  actionId: string;
  payload?: JsonValue;
  objectId?: string;
}

export type PluginActionResponse<T = JsonValue | JsonObject | null> =
  | {
      ok: true;
      data?: T;
    }
  | {
      ok: false;
      error: string;
    };

export interface PluginEventEnvelope {
  pluginId: string;
  eventType: string;
  roomId: string;
  ts: number;
  payload?: JsonValue;
}
