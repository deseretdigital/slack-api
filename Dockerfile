FROM debian:buster

RUN apt-get update -y && apt-get install -y curl software-properties-common wget
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get update && apt-get install -y apache2 \
    dirmngr \
    gnupg \
    apt-transport-https \
    ca-certificates \
    nodejs \
    libapache2-mod-passenger \
    vim \
 && apt-get clean \
 && apt-get autoremove

WORKDIR /var/www/feature-flags
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7
RUN sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger buster main > /etc/apt/sources.list.d/passenger.list'

# COPY ./api /var/www/marketplace-url-to-pdf/api/
COPY package*.json ./
RUN npm install
COPY . .

# Copy over the apache configuration file and enable the site
COPY ./conf/feature-flags.conf /etc/apache2/sites-available/feature-flags.conf
RUN a2enmod passenger
RUN apache2ctl restart
RUN /usr/bin/passenger-config validate-install

RUN a2dissite 000-default.conf
RUN a2ensite feature-flags.conf

EXPOSE 80

CMD  /usr/sbin/apache2ctl -D FOREGROUND