import type React from 'react'

export interface CardProps {
  config: Record<string, any>
  colSpan: number
  rowSpan: number
}

export interface ConfigUIProps {
  config: Record<string, any>
  onChange: (key: string, value: any) => void
}

export interface IntegrationField {
  key: string
  label: string
  type: 'secret' | 'text' | 'url'
  placeholder?: string
  defaultValue?: string
}

export interface IntegrationDef {
  id: string
  label: string
  type?: 'secret' | 'text' | 'url'
  fields?: IntegrationField[]
  testEndpoint?: string
  helpText?: string
  required?: boolean
}

export interface CardDefinition {
  type: string
  label: string
  icon: string
  group: string
  defaultSize: [colSpan: number, rowSpan: number]
  minSize?: [colSpan: number, rowSpan: number]
  needsEntity?: boolean
  defaultDomains?: string[]
  integrations?: IntegrationDef[]
  component: React.ComponentType<any>
  configUI?: React.ComponentType<ConfigUIProps>
}
