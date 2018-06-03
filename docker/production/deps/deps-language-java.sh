#!/usr/bin/env bash
set -e

# Install the JDK and Gradle (use Java 8 since Java 9+ causes issues with the libraries we use)
apt-get install -y --no-install-recommends ca-certificates-java openjdk-8-jdk openjdk-8-jre openjdk-8-jdk-headless openjdk-8-jre-headless unzip
wget --no-verbose --output-document=/tmp/gradle.zip 'https://services.gradle.org/distributions/gradle-4.5.1-bin.zip'
unzip -d /opt /tmp/gradle.zip && mv /opt/gradle-4.5.1 /opt/gradle && rm /tmp/gradle.zip
ln -s /opt/gradle/bin/gradle /usr/bin/gradle
