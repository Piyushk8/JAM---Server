import type { PluginManifest } from "./contracts";
import type { ServerRoomPlugin } from "./serverTypes";
import { jukeboxPlugin } from "./starter/jukebox";
import { pollsPlugin } from "./starter/polls";
import { reactionsPlugin } from "./starter/reactions";
import { stickyNotesPlugin } from "./starter/stickyNotes";

export const installedPlugins: ServerRoomPlugin[] = [
  reactionsPlugin,
  pollsPlugin,
  stickyNotesPlugin,
  jukeboxPlugin,
];

export const getInstalledPluginById = (pluginId: string) =>
  installedPlugins.find((plugin) => plugin.manifest.id === pluginId);

export const getInstalledPluginManifests = (): PluginManifest[] =>
  installedPlugins.map((plugin) => plugin.manifest);

export const validateInstalledPlugins = (): void => {
  const seen = new Set<string>();

  installedPlugins.forEach((plugin) => {
    const { manifest } = plugin;

    if (seen.has(manifest.id)) {
      throw new Error(`Duplicate plugin id detected: ${manifest.id}`);
    }
    seen.add(manifest.id);

    if (!manifest.displayName.trim()) {
      throw new Error(`Plugin ${manifest.id} is missing a displayName`);
    }

    manifest.interactables.forEach((interactable) => {
      if (!interactable.actionId.trim()) {
        throw new Error(
          `Plugin ${manifest.id} has an interactable without an actionId`
        );
      }

      if (!interactable.label.trim()) {
        throw new Error(
          `Plugin ${manifest.id} has an interactable without a label`
        );
      }
    });
  });
};
