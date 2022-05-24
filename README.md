# Payment frontend helper

This package is specifically to used with laravel backed package in order to handler frontend complecations using this package only and actual consumer of this package will only need to call method respectively with proper configurations.

## Installation

-- need to update

## Configuration

Setting up `.env` variables, as of now we are required these 3 variable to be set as environment variable

`STRIPE_PUBLIC` - publishable key provided from the stripe.   
`THANKYOU_PAGE` - page to be display after completion of payment (successfully or unsuccessfully)   
`BACKEND_API` - api end point where your server part will communcate with this package.

to keep all these variable available in the nuxt application you can add the following into `nuxt.config.js`

```js
publicRuntimeConfig: {
    STRIPE_PUBLIC: process.env.STRIPE_PUBLIC,
    THANKYOU_PAGE: process.env.THANKYOU_PAGE,
    BACKEND_API: process.env.BACKEND_API
},
```

the following is recommended axios config for nuxt app.

```js
axios: {
    baseURL: process.env.BACKEND_API,
    proxyHeaders: false,
    credentials: false
}
```


## Dependancies

- [stripe](#stripe)
- [axios](#axios)

### stripe
make sure your stripe script `<script src="https://js.stripe.com/v3/"></script>` (ref: https://stripe.com/docs/js/including)

* Incase of nuxt - you can add it in the nuxt config like this

```js
export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    ...
    script: [
      { src: "https://js.stripe.com/v3/" }
    ]
  },
  ...
}
```

This dependancy we could not extract out from the application and keep the to scoped in the package level, so we have to keep it this way.

Honestly I'm not very happy with this type of dependacy but I don't get any better way.


### axios
for dependancy on axios we allow to pass the instance of axios while setting up payment object.
i.e.
```js
new Payment(settings, axios)
```

here the second parameter is axios dependancy, 

We implemented it this way to keep your existing settings as it is and you just need to pass the dependacy to use it for your server calls.


## Use

basically we need to follow 2 steps to make payment, 

1. Initialisation
2. calling `pay` method

### Initialisation

To initialise payment you need to create new `Payment` object and store it as you needed. (you may store it into the vue store or if you are using it in a single page then you can also store it in the page level variable.)

here you only need to take care of `initCard()` method to be call if you are using card payment. mode detail in [Card Payment](#card-payment) section

```js
const payment = new Payment({
    key: this.$config.STRIPE_PUBLIC,
    api: this.$config.BACKEND_API,
    callback: this.$config.THANKYOU_PAGE
}, this.$axios);
```

You can also store this payment object to page level variable.
```js
this.payment = payment
```

### Alipay Payment

```js
this.payment.pay({
    payment_method: "alipay",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur"
});
```

### Wechat Pay Payment

```js
this.payment.pay({
    payment_method: "wechat_pay",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur"
});
```

### Card Payment

```js
this.payment.pay({
    payment_method: "card",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur"
});
```

### Multibanco Payment

```js
this.payment.pay({
    payment_method: "multibanco",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur",
    name: "Harikrushna Adiecha",
    email: "adiechahari@gmail.com"
});
```

### Bank Transfer / Manual Payment / Cash payment

-- not yet implemented.


### Paypal Payment

--- not yet implemented.
