/**
 * @fileoverview Plugin types export hub.
 * Re-exports all plugin-related types from their respective modules.
 * @module core/plugins/types
 */

// Base types
export type {
  Disposable,
  PluginPriority,
  PluginMetadata,
  BulkOperationResult,
  EventCallback,
  RegistrationOptions,
} from './base';

// Language plugins
export type {
  ConnectionType,
  Connection,
  LanguagePluginContext,
  LanguagePlugin,
  FileMetadata,
  LanguagePluginInfo,
} from './language';

// View plugins
export type {
  ViewContext,
  ViewRenderResult,
  ViewMetadata,
  ViewOptions,
  ViewPlugin,
  ViewPluginInfo,
} from './view';

// Decorator plugins
export type {
  NodeStyle,
  DecoratedNode,
  EdgeStyle,
  DecoratedEdge,
  DecoratorContext,
  NodeDecorator,
  EdgeDecorator,
  DecoratorInfo,
} from './decorator';

// Action plugins
export type {
  ActionLocation,
  ActionTarget,
  ActionContext,
  ActionResult,
  KeyBinding,
  MenuGroup,
  ActionPlugin,
  ActionInfo,
} from './action';

// Filter plugins
export type {
  FilterMode,
  FilterCombination,
  FilterResult,
  FilterMetadata,
  FilterConfig,
  FilterContext,
  FilterUISpec,
  FilterPlugin,
  FilterInfo,
} from './filter';

// Export plugins
export type {
  ExportOutputType,
  ExportCategory,
  ExportOptions,
  ImageExportOptions,
  ExportContext,
  ExportResult,
  ExportUISpec,
  ExportPlugin,
  ExporterInfo,
} from './exporter';

// Settings
export type {
  SettingType,
  SettingValidation,
  SettingDefinition,
  PluginSettingsSchema,
  PluginSettingsAccessor,
  SettingsChangeEvent,
} from './settings';

// Main API
export type {
  PluginEvents,
  GraphAccessor,
  UIAccessor,
  CodeGraphyPluginAPI,
  PluginActivationFunction,
  PluginDeactivationFunction,
  PluginModule,
} from './api';

// Re-export relevant types from shared for convenience
export type {
  IGraphData,
  IGraphNode,
  IGraphEdge,
  NodeSizeMode,
} from '../../../shared/types';
