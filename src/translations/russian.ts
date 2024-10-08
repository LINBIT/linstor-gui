// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const ru = {
  common: {
    disconnected: 'РАСЪЕДИНЕННЫЙ',
    connected: 'СВЯЗАННЫЙ',
    search: 'Поиск по имени',
    property: 'Собственности',
    add: 'Добавить',
    view: 'Осмотретъ',
    edit: 'Редактировать',
    delete: 'Удалитъ',
    lost: 'Потерянный',
    nodes: 'Узел',
    resources: 'Ресурсы',
    volumes: 'Количество',
    error_reports: 'Отчет об ошибках',
    disk_creation_records: 'Записи о создании диска',
    deploy: 'Развертывать',
  },
  menu: {
    dashboard: 'Приборная панель',
    support: 'Поддержка',
    inventory: 'Инвентарь',
    node: 'Узел',
    storage_pools: 'Пулы хранения',
    error_reports: 'Отчет об ошибках',
    software_defined: 'Программное обеспечение',
    resource_groups: 'Группы ресурсов',
    resource_definitions: 'Определения ресурсов',
    resources: 'Ресурсы',
    volumes: 'Количество',
    node_ip_addrs: 'Адресы « IP »',
    remotes: 'Пулты',
    linstor: 'Линстор  « LINSTOR »',
    s3: 'С3 « Linstor »',
  },
  node: {
    node_list: 'Список узлов',
    node_name: 'Имя',
    default_ip: 'По умолчанию  « IP »',
    default_port: 'Порт по умолчанию',
    node_type: 'Тип',
    node_status: 'Статус',
    node_detail: 'Детали узла',
  },
  storage_pool: {
    list: 'Список пулов хранения',
    name: 'Имя',
    node_name: 'Имя узла',
    network_preference: 'Сетевые предпочтения',
    disk: 'Диск',
    provider_kind: 'Тип поставщика',
    capacity: 'Емкость',
    free_capacity: 'Свободная Емкость',
    total_capacity: 'Общая вместимость',
    supports_snapshots: 'Снапшот',
  },
  ip_address: {
    list: 'Список адресов',
    node: 'Узел',
    ip_address: 'Адресы « IP »',
    tcp_port: 'Порт « TCP »',
    alias: 'Alias',
    is_management_network: 'Является ли сеть управления',
  },
  error_report: {
    name: 'ID',
    time: 'Времия',
    message: 'Сообщение',
    action: 'Действие',
    detail_title: 'Сведения об отчете об ошибке',
    list_title: 'Список отчетов об ошибках',
  },
  dashboard: {
    title: 'Панель приборов',
  },
  resource_group: {
    list: 'Список групп ресурсов',
    name: 'Имя группы ресурсов',
    place_count: 'Место',
    storage_pools: 'Пул(ы) хранения',
    replication: 'Режим репликации',
    auto: 'Авто',
    async: 'Асинхронный',
    semi_sync: 'Синхронная память',
    sync: 'Синхронный',
    diskless: 'Без дисков',
    description: 'Описание',
  },
  resource_definition: {
    name: 'Имя',
    list: 'Список определений ресурсов',
    resource_group_name: 'Имя группы ресурсов',
    size: 'Размер',
    port: 'Порт',
    state: 'Состояние',
    replication: 'Режим репликации',
    auto: 'Авто',
    async: 'Асинхронный',
    semi_sync: 'Синхронная память',
    sync: 'Синхронный',
    diskless: 'Без дисков',
    description: 'Описание',
  },
  resource: {
    list: 'Список ресурсов',
    resource_name: 'Имя',
    resource_node: 'Узел',
    resource_port: 'Port',
    resource_usage: 'Статус использования',
    resource_conn: 'Статус подключения',
    resource_state: 'Состояние',
    resource_create_time: 'Создать время',
  },
  volume: {
    list: 'Список томов',
    name: 'Имя',
    node: 'Узел',
    resource: 'Ресурсы',
    storage_pool: 'Пулы хранения',
    device_name: 'Имя устройства',
    allocated: 'Выделено',
    in_use: 'В использовании',
    state: 'Состояние',
  },
  controller: {
    controller_detail: 'Сведения о контроллере',
  },
  // Remote / Linstor
  linstor: {
    list: 'Linstor List',
  },
};

export default ru;
