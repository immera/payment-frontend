const { loadScript } = require("@paypal/paypal-js");

const Payment = function(settings, axios) {
    this._settings = settings;
    this._axios = axios;
    this._stripe = Stripe(settings.key)
    this.paypal = null
    this.__proto__ = {
      _requestPayment: function(payment_method, options) {
        return this._axios.post('/payment/request', {
          "return_url": this._settings.callback,
          "payment_method": payment_method,
          ...options
        })
      },
      alipay: function(options) {
        return this._requestPayment('alipay', options)
          .then(({data}) => {
            this._stripe.confirmAlipayPayment(
              data.response.client_secret, {
                return_url: data.callback
              }
            ).then(function(result) {
              if (result.error) {
                // Inform the customer that there was an error.
                console.error(error);
              }
            }).catch(console.error);
          })
      },
      wechat_pay: function(options) {
        return this._requestPayment('wechat_pay', options)
          .then(({data}) => {
            this._stripe.confirmWechatPayPayment(
              data.response.client_secret,
              {
                payment_method_options: {
                  wechat_pay: { client: 'web' }
                }
              }
            ).then(({error, paymentIntent}) => {
              if (error) {
                // Inform the customer that there was an error.
                console.error(error);
              } else {
                console.log(data, paymentIntent)
                // this._axios.post(data.callback, paymentIntent)
                //   .then(console.log)
                //   .catch(console.error)
              }
            });
          })
      },
      initCard: function(cardId) {
        let element = this._stripe.elements();
        this.cardElem = element.create('card');
        this.cardElem.mount(cardId)
      },
      initPaypalBtn: function(btnId, {currency, amount}, options = {}) {
        currency = currency.toUpperCase()
        amount = (number(amount)/100).toFixed(2);

        try {
          this.paypal = await loadScript({ "client-id": "test" , "currency": currency });
        } catch (error) {
          console.error("failed to load the PayPal JS SDK script", error);
        }
        if (paypal) {
          try {
            await this.paypal.Buttons({
              style: {
                layout: 'horizontal',
                color: "blue",
                tagline: false,
              },
              createOrder: function(data, actions) {
                // Set up the transaction
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      currency_code: currency,
                      value: amount
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  alert('Transaction completed by ' + details.payer.name.given_name);
                });
              },
              onCancel: function (data) {
                // Show a cancel page, or return to cart
                console.log("Cancelled !!!", data)
              },
              onError: function (err) {
                // For example, redirect to a specific error page
                console.error(err)
                // window.location.href = "/your-error-page-here";
              }
            }).render(btnId);
          } catch (error) {
            console.error("failed to render the PayPal Buttons", error);
          }
      }
  




      },
      card: function(options) {
        return this._requestPayment('card', options)
          .then(({data}) => {
            this._stripe.confirmCardPayment(
              data.response.client_secret, {
                payment_method: {card: this.cardElem}
              }
            ).then(function(result) {
              if (result.error) {
                // Inform the customer that there was an error.
                console.error(error);
              }
              console.log("Possibly successful payment")
              console.log(result)
            }).catch(console.error);
          })
      },
      multibanco: function(options) {
        return this._requestPayment('multibanco', options)
          .then(({data}) => data.response)
          .then(({
            multibanco, status, currency, amount
          }) => ({
            multibanco: {
              entity: multibanco.entity,
              reference: multibanco.reference
            }, status, currency, amount
          }))
      },
      pay: function({payment_method, ...options}) {
        return this[payment_method](options)
      },
      ack: function(id, status) {
        return this._axios.put(`/payment/instances/${id}/ack`, {status})
      },
      get: function(query) {
        return this._axios.get(`/payment/instances`, query)
      }
    }
  }
  
  module.exports = Payment