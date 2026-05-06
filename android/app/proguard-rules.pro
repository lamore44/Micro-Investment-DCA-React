# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.**    { *; }

# Kotlin
-keep class kotlin.**                { *; }
-keep class kotlinx.**               { *; }
-dontwarn kotlin.**

# App package
-keep class com.oksobatsister.microdca.** { *; }

# General Android
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
