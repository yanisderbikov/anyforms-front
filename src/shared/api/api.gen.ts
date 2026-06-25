/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Запрос на запуск SalesBot для всех лидов в заданной воронке/статусе */
export interface RunSalesbotBatchRequestDTO {
  /**
   * ID воронки в amoCRM
   * @format int64
   * @example 7654321
   */
  pipelineId: number;
  /**
   * ID статуса (колонки) в amoCRM
   * @format int64
   * @example 12345678
   */
  statusId: number;
  /**
   * ID бота SalesBot для запуска
   * @format int64
   * @example 1234
   */
  botId: number;
}

export interface ProductCreateUpdateRequestDTO {
  /** @format uuid */
  id?: string;
  name: string;
  description: string;
  folder: string;
  price: string;
  crossedPrice?: string;
  discountPercent?: string;
  tgLink: string;
  /** @format int32 */
  orderNumber?: number;
}

export interface ProductDTO {
  /** @format uuid */
  id?: string;
  name?: string;
  description?: string;
  photos?: string[];
  price?: string;
  crossedPrice?: string;
  discountPercent?: string;
  tgLink?: string;
}

export interface Amount {
  value?: string;
  currency?: string;
}

export interface PaymentData {
  /** @format uuid */
  id?: string;
  status?: string;
  amount?: Amount;
  income_amount?: Amount;
}

export interface YooKassaWebhookBody {
  type?: string;
  event?: string;
  object?: PaymentData;
}

export interface PurchaseRequest {
  productCode: string;
  email: string;
  fullName?: string;
  phone?: string;
  marketingConsent?: boolean;
  returnUrl?: string;
}

export interface PaymentUrlResponse {
  /** @format uuid */
  externalPaymentId?: string;
  paymentUrl?: string;
  amount?: Amount;
}

/** Запрос на установку трекера для заказа */
export interface SetTrackerAndCommentRequestDTO {
  /**
   * ID сделки в AmoCRM
   * @format int64
   * @example 12345
   */
  leadId: number;
  /**
   * Номер трекера
   * @example "CDEK123456789"
   */
  tracker: string;
  /**
   * Комментарий
   * @example "коммент"
   */
  comment: string;
}

/** Стандартный ответ API */
export interface ApiResponseDTO {
  /**
   * Флаг успешности операции
   * @example true
   */
  success?: boolean;
  /**
   * Сообщение об ошибке (если есть)
   * @example "Заказ не найден"
   */
  error?: string;
  /**
   * ID сделки в AmoCRM
   * @format int64
   * @example 12345
   */
  leadId?: number;
  /**
   * Номер трекера
   * @example "CDEK123456789"
   */
  tracker?: string;
  /**
   * Количество товаров
   * @format int32
   * @example 5
   */
  itemsCount?: number;
}

/** Запрос на синхронизацию заказа из AmoCRM */
export interface SyncOrderRequestDTO {
  /**
   * ID сделки в AmoCRM
   * @format int64
   * @example 12345
   */
  leadId: number;
}

/** Запрос на создание заявки из лендинга */
export interface LandingLeadRequestDTO {
  /**
   * Название сделки
   * @example "заявка с лендинга"
   */
  leadName?: string;
  /**
   * Имя клиента
   * @example "Иван"
   */
  name?: string;
  /**
   * Телефон клиента
   * @example "+79991234567"
   */
  phone: string;
}

/** Запрос на вход */
export interface LoginRequestDTO {
  /** Логин */
  username: string;
  /** Пароль */
  password: string;
}

/** Ответ с токеном */
export interface LoginResponseDTO {
  /** JWT токен */
  token?: string;
}

export interface PaymentProductDTO {
  code?: string;
  title?: string;
  price?: string;
}

/** Элемент заказа (товар) */
export interface OrderItemDTO {
  /**
   * Название товара
   * @example "Товар 1"
   */
  productName?: string;
  /**
   * Количество
   * @format int32
   * @example 2
   */
  quantity?: number;
  /**
   * ID товара в AmoCRM
   * @format int64
   * @example 111
   */
  productId?: number;
}

/** Сводка по заказу без трекера */
export interface OrderSummaryDTO {
  /**
   * ID сделки в AmoCRM
   * @format int64
   * @example 12345
   */
  leadId?: number;
  /**
   * ID контакта в AmoCRM
   * @format int64
   * @example 67890
   */
  contactId?: number;
  /**
   * Имя контакта
   * @example "Иван Иванов"
   */
  contactName?: string;
  /**
   * Телефон контакта
   * @example "+79991234567"
   */
  contactPhone?: string;
  /**
   * ПВЗ СДЭК улица
   * @example "ул. Ленина, 1"
   */
  pvzSdekStreet?: string;
  /**
   * ПВЗ СДЭК город
   * @example "Москва"
   */
  pvzSdekCity?: string;
  /**
   * Дата покупки
   * @format date-time
   */
  purchaseDate?: string;
  /**
   * Комментарий
   * @example "Инфа о доставки например"
   */
  comment?: string;
  /**
   * Статус доставки
   * @example "Статус доставки"
   */
  deliveryStatus?: string;
  /**
   * Трекер доставки
   * @example "121212"
   */
  tracker?: string;
  /** Список товаров в заказе */
  items?: OrderItemDTO[];
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "https://anyforms.ru/",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title anyforms
 * @version 1.0.0
 * @baseUrl https://anyforms.ru/
 *
 * Документация API
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  webhook = {
    /**
     * No description
     *
     * @tags webhook-controller
     * @name HandleCdekWebhook
     * @request POST:/webhook/cdek
     */
    handleCdekWebhook: (data: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/webhook/cdek`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags webhook-controller
     * @name HandleAmoCrmWebhook
     * @request POST:/webhook/amocrm
     */
    handleAmoCrmWebhook: (data: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/webhook/amocrm`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags webhook-controller
     * @name HandleAmoCrmSyncOrderWebhook
     * @request POST:/webhook/amocrm/sync-order
     */
    handleAmoCrmSyncOrderWebhook: (data: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/webhook/amocrm/sync-order`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags webhook-controller
     * @name HandleAmoCrmNewMessage
     * @request POST:/webhook/amocrm/new-message
     */
    handleAmoCrmNewMessage: (data: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/webhook/amocrm/new-message`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags salesbot-webhook-controller
     * @name FailSendMessage
     * @request POST:/webhook/amocrm/fail-send-message
     */
    failSendMessage: (data: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/webhook/amocrm/fail-send-message`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags webhook-controller
     * @name HandleAmoCrmCalculate
     * @request POST:/webhook/amocrm/calculate
     */
    handleAmoCrmCalculate: (data: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/webhook/amocrm/calculate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  api = {
    /**
     * @description Возвращает 202 сразу, прогон идёт асинхронно. Лиды, которым этот бот уже успешно запускался (есть SUCCESS в bot_execution_log), пропускаются.
     *
     * @tags Salesbot
     * @name RunBatch
     * @summary Запустить SalesBot для всех лидов в заданной воронке/статусе (в фоне)
     * @request POST:/api/salesbot/run-batch
     * @secure
     */
    runBatch: (data: RunSalesbotBatchRequestDTO, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/salesbot/run-batch`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description POST с телом продукта. Если передан id — обновляется продукт с этим id. Иначе создаётся новый. Поле folder — папка в S3 (под shop/) с фото.
     *
     * @tags Product
     * @name SaveOrUpdateProduct
     * @summary Создать или обновить продукт
     * @request POST:/api/product/create
     * @secure
     */
    saveOrUpdateProduct: (
      data: ProductCreateUpdateRequestDTO,
      params: RequestParams = {},
    ) =>
      this.request<ProductDTO, any>({
        path: `/api/product/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Принимает уведомления об изменении статуса платежа
     *
     * @tags Payment
     * @name YooKassaWebhook
     * @summary Вебхук Юкассы
     * @request POST:/api/payment/yookassa-webhook
     */
    yooKassaWebhook: (data: YooKassaWebhookBody, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/payment/yookassa-webhook`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Создаёт платёж в Юкассе и возвращает ссылку на оплату
     *
     * @tags Payment
     * @name Purchase
     * @summary Купить продукт
     * @request POST:/api/payment/purchase
     */
    purchase: (data: PurchaseRequest, params: RequestParams = {}) =>
      this.request<PaymentUrlResponse, any>({
        path: `/api/payment/purchase`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Устанавливает трекер для заказа и обновляет данные в Google Sheets и AmoCRM
     *
     * @tags Orders
     * @name SetTrackerAndComment
     * @summary Установить трекер для заказа
     * @request POST:/api/orders/tracker-and-comment
     * @secure
     */
    setTrackerAndComment: (
      data: SetTrackerAndCommentRequestDTO,
      params: RequestParams = {},
    ) =>
      this.request<ApiResponseDTO, ApiResponseDTO>({
        path: `/api/orders/tracker-and-comment`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Синхронизирует заказ из AmoCRM в базу данных
     *
     * @tags Orders
     * @name SyncOrder
     * @summary Синхронизировать заказ из AmoCRM
     * @request POST:/api/orders/sync
     * @secure
     */
    syncOrder: (data: SyncOrderRequestDTO, params: RequestParams = {}) =>
      this.request<ApiResponseDTO, ApiResponseDTO>({
        path: `/api/orders/sync`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Синхронизирует заказ из AmoCRM в базу данных
     *
     * @tags Orders
     * @name SyncOrder1
     * @summary Синхронизировать заказ из AmoCRM
     * @request POST:/api/orders/sync/list
     * @secure
     */
    syncOrder1: (data: SyncOrderRequestDTO[], params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/orders/sync/list`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Landing
     * @name CreateLead
     * @summary Создать заявку в amoCRM из имени и телефона
     * @request POST:/api/landing/lead
     */
    createLead: (data: LandingLeadRequestDTO, params: RequestParams = {}) =>
      this.request<ApiResponseDTO, any>({
        path: `/api/landing/lead`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags cdek-webhook-controller
     * @name Subscribe
     * @request POST:/api/cdek/webhook/subscribe
     */
    subscribe: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/cdek/webhook/subscribe`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Login
     * @summary Вход, получение токена
     * @request POST:/api/auth/login
     */
    login: (data: LoginRequestDTO, params: RequestParams = {}) =>
      this.request<LoginResponseDTO, any>({
        path: `/api/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name GetAllProducts
     * @summary Получить все продукты
     * @request GET:/api/product
     */
    getAllProducts: (params: RequestParams = {}) =>
      this.request<ProductDTO[], any>({
        path: `/api/product`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payment
     * @name Products
     * @summary Доступные продукты для покупки
     * @request GET:/api/payment/products
     */
    products: (params: RequestParams = {}) =>
      this.request<PaymentProductDTO[], any>({
        path: `/api/payment/products`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Возвращает список всех заказов без трекера, сгруппированных по заказчику
     *
     * @tags Orders
     * @name GetOrdersWithoutTracker
     * @summary Получить заказы без трекера
     * @request GET:/api/orders/without-tracker
     * @secure
     */
    getOrdersWithoutTracker: (params: RequestParams = {}) =>
      this.request<OrderSummaryDTO, any>({
        path: `/api/orders/without-tracker`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name GetDeliveringOrders
     * @summary Получить заказы которые доставляются
     * @request GET:/api/orders/delivering
     * @secure
     */
    getDeliveringOrders: (params: RequestParams = {}) =>
      this.request<OrderSummaryDTO[], any>({
        path: `/api/orders/delivering`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name GetCreatedOrders
     * @summary Получить заказы которые созданы / сделаны накладные но еще не отправлены
     * @request GET:/api/orders/created
     * @secure
     */
    getCreatedOrders: (params: RequestParams = {}) =>
      this.request<OrderSummaryDTO[], any>({
        path: `/api/orders/created`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
