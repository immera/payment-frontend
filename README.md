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

here you only need to take care of `initCard("#card")` method to be call if you are using card payment. mode detail in [Card Payment](#card-payment) section

```js
const payment = new Payment({
    key: this.$config.STRIPE_PUBLIC,
    api: this.$config.BACKEND_API,
    callback: this.$config.THANKYOU_PAGE,
    customer: {
        email: "harikrushna@twopeople.company",
        name: "Harikrushna"
    }
}, this.$axios);
```

**Make sure the customer you are setting is same as logged in user, to make it work smoothly.**

You can also store this payment object to page level variable.
```js
this.payment = payment
```

### Alipay Payment

```js
this.payment.pay({
    payment_method: "alipay",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur",
    additional_info: {
        // ...
        // Whatever you want in the backend event handler you can add them here
        // ...
    }
});
```

### Wechat Pay Payment

```js
this.payment.pay({
    payment_method: "wechat_pay",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur",
    additional_info: {
        // ...
        // Whatever you want in the backend event handler you can add them here
        // ...
    }
});
```

### Card Payment

for making card payment you need to have all cards list which is added for that customer

so here is the method to get all cards.
```js
this.payment.cardList()
```
this method returns a promise, so you can wait for response or you can write then to handle response.

using this method you will get all the cards which is belongs to the initialized customer.

_**Note:** Initilized custimer will be set at the time of initialization_

Once you have list of cards, you can display them how ever you want to display according to your ui. when you want to make payment using card you supposed to be do it as bellow.

```js
this.payment.pay({
    payment_method: "card",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur",
    source: "card_some_random_key", // card id will be pass here.
    additional_info: {
        // ...
        // Whatever you want in the backend event handler you can add them here
        // ...
    }
});
```

**Add new Card** In order to add new card, you can use the following code.

```js
this.payment.createNewCard({
    "number": "5555555555554444", // Card number 16 digit
    "expiry_date": "11/2027", // Expiry MM/YYYY, as given example
    "cvc": "123" // 3 digit CVC code
});
```

### Multibanco Payment

```js
this.payment.pay({
    payment_method: "multibanco",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur",
    additional_info: {
        // ...
        // Whatever you want in the backend event handler you can add them here
        // ...
    }
});
```

### Bank Transfer / Manual Payment / Cash payment

Here we consider this method as `cash` payment. that can include bank transfer or any kind of manual fund transfer. in this case you supposed to be acknoledge from the frontend.

**Initialise Payment**

```js
this.payment.pay({
    payment_method: "cash",
    amount: 1999, // here the amount will be in the smallest unit of currency.
    currency: "eur",
    additional_info: {
        // ...
        // Whatever you want in the backend event handler you can add them here
        // ...
    }
});
```

**Acknoledge Payment**

This part must be done from the admin side. make sure this function call will be done from the admin side.

```js
this.payment.ack(123) // here the argument will be id of payment
```

when this method get called it will be considered to be successful payment.

To get all transaction check out `get` [method](#get_method)


### Paypal Payment

To make payment using paypal, we need to use their button ui as it is, so in order to place the button, we need to specify it's container as bellow.

```html
<div id="paypal-container"></div>
```

and initialize the paypal payment using following code.

```js
this.payment.initPaypalBtn("#paypal-container", {
    currency: "eur",
    amount: 100 // Make sure whatever the value we given here will be devided by 100 and send float value to the actual api
});
```

### get method

here we expose an function call that will actually call backend api to get all the transactions.

```js
let pay = new Payment(...) // Create payment object
query = {payment_method: "cash"}
pay.get(query)

```